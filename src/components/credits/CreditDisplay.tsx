import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, TrendingDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export const CreditDisplay = () => {
  const { hasRole } = useAuth();
  const { credits, transactions, loading } = useCredits();

  if (!hasRole('pro_user') && !hasRole('qtra_arborist') && !hasRole('traq_arborist') && !hasRole('admin')) {
    return null;
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-20 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Credits
        </CardTitle>
        <CardDescription>
          Your credit balance and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {credits?.balance || 0}
          </div>
          <p className="text-sm text-muted-foreground">Available Credits</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              {credits?.lifetime_earned || 0}
            </div>
            <p className="text-muted-foreground">Earned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              {credits?.lifetime_spent || 0}
            </div>
            <p className="text-muted-foreground">Spent</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <History className="w-4 h-4 mr-2" />
              Transaction History
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Credit Transaction History</DialogTitle>
              <DialogDescription>
                Your recent credit activity
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={transaction.amount > 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {transaction.transaction_type}
                        </Badge>
                        <span
                          className={`font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};