import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Shield, 
  Award, 
  TreePine, 
  Star, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';

type AssessmentType = 'basic_ai' | 'detailed_ai' | 'qtra_validation' | 'traq_validation' | 'dual_validation' | 'expert_manual';

interface AssessmentOption {
  id: AssessmentType;
  name: string;
  description: string;
  features: string[];
  credits: number;
  icon: React.ComponentType<any>;
  recommended?: boolean;
}

const assessmentOptions: AssessmentOption[] = [
  {
    id: 'basic_ai',
    name: 'AI Basic Assessment',
    description: 'Essential risk screening for new users',
    features: [
      'Core QTRA methodology',
      'Basic defect detection',
      'Simple risk calculation',
      'PDF report generation'
    ],
    credits: 10,
    icon: Brain,
    recommended: true
  },
  {
    id: 'detailed_ai',
    name: 'AI Detailed Assessment',
    description: 'Comprehensive analysis with full system capabilities',
    features: [
      'Advanced species intelligence',
      'Complete defect analysis',
      'Site suitability assessment',
      'Regulatory compliance check',
      'Enhanced reporting',
      'Knowledge base integration'
    ],
    credits: 50,
    icon: Shield
  },
  {
    id: 'qtra_validation',
    name: 'QTRA Professional Validation',
    description: 'Certified arborist review of your AI assessment',
    features: [
      'Includes Detailed AI Assessment',
      'QTRA-certified arborist review',
      'Professional validation report',
      'Quality assurance certificate'
    ],
    credits: 85,
    icon: Award
  },
  {
    id: 'traq_validation',
    name: 'TRAQ Professional Validation',
    description: 'TRAQ-certified arborist review of your assessment',
    features: [
      'Includes Detailed AI Assessment',
      'TRAQ-certified arborist review',
      'Professional validation report',
      'Quality assurance certificate'
    ],
    credits: 85,
    icon: Award
  },
  {
    id: 'dual_validation',
    name: 'Dual Validation Bundle',
    description: 'Both QTRA and TRAQ validation for maximum confidence',
    features: [
      'Includes Detailed AI Assessment',
      'Both QTRA & TRAQ validation',
      'Comprehensive validation reports',
      'Dual certification',
      'Save 30 credits vs individual'
    ],
    credits: 140,
    icon: Star
  },
  {
    id: 'expert_manual',
    name: 'Expert Manual Review',
    description: 'Custom-priced on-site professional assessment',
    features: [
      'Local certified arborist visit',
      'Physical tree inspection',
      'Custom pricing negotiation',
      'Detailed field report',
      'Professional recommendations'
    ],
    credits: 0,
    icon: TreePine
  }
];

interface AssessmentTypeSelectorProps {
  onSelect: (type: AssessmentType, credits: number) => void;
  treeId?: string;
}

export const AssessmentTypeSelector = ({ onSelect, treeId }: AssessmentTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState<AssessmentType>('basic_ai');
  const { credits, hasCredits, spendCredits } = useCredits();
  const [processing, setProcessing] = useState(false);

  const selectedOption = assessmentOptions.find(opt => opt.id === selectedType);

  const handleProceed = async () => {
    if (!selectedOption) return;

    if (selectedOption.id === 'expert_manual') {
      // Handle expert manual review differently
      toast.info('Expert review request functionality coming soon!');
      return;
    }

    if (selectedOption.credits > 0 && !hasCredits(selectedOption.credits)) {
      toast.error(`Insufficient credits. You need ${selectedOption.credits} credits but only have ${credits?.balance || 0}.`);
      return;
    }

    setProcessing(true);
    try {
      if (selectedOption.credits > 0) {
        const success = await spendCredits(
          selectedOption.credits,
          `${selectedOption.name} for tree assessment`,
          treeId
        );
        
        if (!success) {
          setProcessing(false);
          return;
        }
      }

      onSelect(selectedType, selectedOption.credits);
      toast.success(`${selectedOption.name} initiated successfully!`);
    } catch (error) {
      console.error('Assessment initiation error:', error);
      toast.error('Failed to start assessment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Assessment Type</CardTitle>
        <CardDescription>
          Select the level of assessment you need for your tree risk evaluation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as AssessmentType)}
          className="space-y-4"
        >
          {assessmentOptions.map((option) => {
            const IconComponent = option.icon;
            const canAfford = option.credits === 0 || hasCredits(option.credits);
            
            return (
              <div
                key={option.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedType === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                } ${!canAfford ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <RadioGroupItem value={option.id} id={option.id} disabled={!canAfford} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{option.name}</h3>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {option.description}
                        </p>
                        
                        <ul className="space-y-1 text-xs text-muted-foreground mb-3">
                          {option.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {option.credits > 0 ? (
                              <Badge variant="outline" className="font-medium">
                                {option.credits} credits
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-medium">
                                Custom Pricing
                              </Badge>
                            )}
                          </div>
                          
                          {option.credits > 0 && !canAfford && (
                            <div className="flex items-center gap-1 text-destructive text-xs">
                              <AlertCircle className="w-3 h-3" />
                              Insufficient credits
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Your balance: <span className="font-medium">{credits?.balance || 0} credits</span>
          </div>
          
          <Button
            onClick={handleProceed}
            disabled={processing || (selectedOption?.credits && selectedOption.credits > 0 && !hasCredits(selectedOption.credits))}
            className="min-w-32"
          >
            {processing ? 'Processing...' : 
             selectedOption?.id === 'expert_manual' ? 'Request Expert Review' : 
             'Start Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};