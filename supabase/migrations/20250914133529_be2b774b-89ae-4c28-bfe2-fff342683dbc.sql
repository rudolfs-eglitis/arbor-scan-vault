-- Create user_credits table
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_credits_user_id_unique UNIQUE (user_id)
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- Positive for earning, negative for spending
  transaction_type text NOT NULL, -- 'earned', 'spent', 'bonus', 'refund'
  description text NOT NULL,
  related_assessment_id uuid REFERENCES assessments(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create assessment_methodologies table
CREATE TABLE public.assessment_methodologies (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  version text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default methodologies
INSERT INTO public.assessment_methodologies (id, name, description, version) VALUES
('qtra', 'Quantified Tree Risk Assessment', 'British standard for quantifying tree risk', '4.0'),
('traq', 'Tree Risk Assessment Qualification', 'ISA methodology for tree risk assessment', '2.0');

-- Create assessment_validations table
CREATE TABLE public.assessment_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  validator_id uuid NOT NULL REFERENCES auth.users(id),
  methodology_id text NOT NULL REFERENCES assessment_methodologies(id),
  validation_status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
  validation_notes text,
  credits_earned integer DEFAULT 0,
  validated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits"
ON public.user_credits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits"
ON public.user_credits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for assessment_methodologies
CREATE POLICY "Authenticated users can view methodologies"
ON public.assessment_methodologies
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage methodologies"
ON public.assessment_methodologies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for assessment_validations
CREATE POLICY "Users can view validations for their assessments"
ON public.assessment_validations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assessments a 
    WHERE a.id = assessment_id 
    AND a.assessor_id = auth.uid()
  )
);

CREATE POLICY "Validators can view their assigned validations"
ON public.assessment_validations
FOR SELECT
USING (auth.uid() = validator_id);

CREATE POLICY "Certified arborists can create validations"
ON public.assessment_validations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'qtra_arborist'::app_role) OR 
  has_role(auth.uid(), 'traq_arborist'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Validators can update their validations"
ON public.assessment_validations
FOR UPDATE
USING (
  auth.uid() = validator_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all validations"
ON public.assessment_validations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add methodology_id to assessments table
ALTER TABLE public.assessments 
ADD COLUMN methodology_id text REFERENCES assessment_methodologies(id) DEFAULT 'qtra';

-- Create triggers for credit management
CREATE OR REPLACE FUNCTION public.update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update user credits balance
    INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      balance = user_credits.balance + NEW.amount,
      lifetime_earned = user_credits.lifetime_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      lifetime_spent = user_credits.lifetime_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for credit transactions
CREATE TRIGGER update_credits_on_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_credits();

-- Create function to award credits for validation
CREATE OR REPLACE FUNCTION public.award_validation_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award credits when validation is completed (approved/rejected)
  IF NEW.validation_status IN ('approved', 'rejected') AND OLD.validation_status = 'pending' THEN
    -- Calculate credits based on methodology and complexity
    NEW.credits_earned := CASE 
      WHEN NEW.methodology_id = 'qtra' THEN 10
      WHEN NEW.methodology_id = 'traq' THEN 12
      ELSE 8
    END;
    
    -- Insert credit transaction
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      related_assessment_id
    ) VALUES (
      NEW.validator_id,
      NEW.credits_earned,
      'earned',
      'Assessment validation completed (' || NEW.methodology_id || ')',
      NEW.assessment_id
    );
    
    NEW.validated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for validation credits
CREATE TRIGGER award_credits_on_validation
  BEFORE UPDATE ON public.assessment_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_validation_credits();