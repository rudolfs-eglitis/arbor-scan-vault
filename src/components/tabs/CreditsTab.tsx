import { useAuth } from '@/hooks/useAuth';
import { CreditDisplay } from '@/components/credits/CreditDisplay';
import { CreditPurchase } from '@/components/credits/CreditPurchase';
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

      <div className="grid gap-6 lg:grid-cols-3">
        <CreditDisplay />
        <CreditPurchase />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Assessment Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isArborist ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-medium">Earn Credits by Validating</h4>
                    <p className="text-sm text-muted-foreground">
                      Review and validate AI assessments to earn credits
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>QTRA Validation Review:</span>
                    <Badge variant="outline">85 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TRAQ Validation Review:</span>
                    <Badge variant="outline">85 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dual Validation Review:</span>
                    <Badge variant="outline">140 credits</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TreePine className="w-5 h-5 mt-0.5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Expert Manual Reviews</h4>
                    <p className="text-sm text-muted-foreground">
                      Accept custom pricing on-site assessment requests
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Coins className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium">AI Basic Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      Essential risk screening with core QTRA methodology
                    </p>
                  </div>
                </div>
                <div className="pl-8">
                  <div className="flex justify-between text-sm">
                    <span>Basic AI Assessment:</span>
                    <Badge variant="outline">10 credits</Badge>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-medium">AI Detailed Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive analysis with full system capabilities
                    </p>
                  </div>
                </div>
                <div className="pl-8">
                  <div className="flex justify-between text-sm">
                    <span>Detailed AI Assessment:</span>
                    <Badge variant="outline">50 credits</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 mt-0.5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Professional Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Certified arborist review of your AI assessments
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>QTRA Validation:</span>
                    <Badge variant="outline">85 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TRAQ Validation:</span>
                    <Badge variant="outline">85 credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dual Validation Bundle:</span>
                    <Badge variant="outline">140 credits</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TreePine className="w-5 h-5 mt-0.5 text-destructive" />
                  <div>
                    <h4 className="font-medium">Expert Manual Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Custom pricing for on-site professional assessments
                    </p>
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