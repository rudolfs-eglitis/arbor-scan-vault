import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  is_active: boolean;
}

export const CreditPurchase = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load credit packages');
    }
  };

  const handlePurchase = async (packageId: string, credits: number, price: number) => {
    setLoading(true);
    try {
      // TODO: Integrate with payment processor (Stripe, etc.)
      toast.info('Payment integration coming soon!');
      console.log('Purchase:', { packageId, credits, price });
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const getValueText = (credits: number, price: number) => {
    const pricePerCredit = price / credits;
    return `$${pricePerCredit.toFixed(3)} per credit`;
  };

  const getBestValuePackage = () => {
    if (packages.length === 0) return null;
    return packages.reduce((best, current) => {
      const bestValue = best.price_usd / best.credits;
      const currentValue = current.price_usd / current.credits;
      return currentValue < bestValue ? current : best;
    });
  };

  const bestValue = getBestValuePackage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Purchase Credits
        </CardTitle>
        <CardDescription>
          Buy credit packages to access ArborQuant's assessment services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-4 border rounded-lg ${
                bestValue?.id === pkg.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              {bestValue?.id === pkg.id && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>
              )}
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold">{pkg.name}</h3>
                <div className="flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold">{pkg.credits}</span>
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <div className="text-lg font-semibold text-primary">
                  ${pkg.price_usd.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getValueText(pkg.credits, pkg.price_usd)}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.id, pkg.credits, pkg.price_usd)}
                  disabled={loading}
                  variant={bestValue?.id === pkg.id ? 'default' : 'outline'}
                >
                  Purchase Package
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">What you can do with credits:</p>
          <ul className="space-y-1 text-xs">
            <li>• AI Basic Assessment: 10 credits</li>
            <li>• AI Detailed Assessment: 50 credits</li>
            <li>• QTRA or TRAQ Validation: 85 credits each</li>
            <li>• Dual Validation Bundle: 140 credits (save 30 credits)</li>
            <li>• Expert Manual Reviews: Custom pricing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};