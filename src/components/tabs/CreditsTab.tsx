import { useAuth } from '@/hooks/useAuth';
import { CreditDisplay } from '@/components/credits/CreditDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Award, Shield, TreePine } from 'lucide-react';

export const CreditsTab = () => {
  const { hasRole } = useAuth();

  if (!hasRole('pro_user') && !hasRole('qtra_arborist') && !hasRole('traq_arborist') && !hasRole('admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Credits System</CardTitle>
            <CardDescription>
              Upgrade to Pro User to access the credits system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The credits system allows Pro Users to purchase professional validation services
              from certified arborists. Upgrade your account to access this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isArborist = hasRole('qtra_arborist') || hasRole('traq_arborist');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Coins className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Credits System</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CreditDisplay />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isArborist ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-medium">Earn Credits</h4>
                    <p className="text-sm text-muted-foreground">
                      Review and validate tree risk assessments to earn credits
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>QTRA Assessment Review:</span>
                    <Badge variant="outline">10 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TRAQ Assessment Review:</span>
                    <Badge variant="outline">12 credits</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TreePine className="w-5 h-5 mt-0.5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Redeem Credits</h4>
                    <p className="text-sm text-muted-foreground">
                      Use earned credits for advanced features or cash out
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Coins className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium">Purchase Credits</h4>
                    <p className="text-sm text-muted-foreground">
                      Buy credits to access professional validation services
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-medium">Professional Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Have your assessments reviewed by certified arborists
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>QTRA Validation:</span>
                    <Badge variant="outline">15 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TRAQ Validation:</span>
                    <Badge variant="outline">18 credits</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};