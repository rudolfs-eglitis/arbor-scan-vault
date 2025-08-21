import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Loader2, TreePine, Bug, ChevronDown, RefreshCw } from 'lucide-react';

export default function Auth() {
  const { 
    user, 
    signIn, 
    signUp, 
    signInWithGoogle, 
    loading, 
    debugInfo,
    clearError 
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  // Clear local error when auth error is cleared
  useEffect(() => {
    if (!debugInfo.lastError) {
      setError(null);
    }
  }, [debugInfo.lastError]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    clearError();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error: authError } = await signIn(email, password);
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        setError(`Sign in failed: ${authError.message}`);
      }
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    clearError();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    // Client-side validation
    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await signUp(email, password, displayName);
    
    if (authError) {
      if (authError.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (authError.message.includes('Password should be at least')) {
        setError('Password does not meet security requirements. Please use a stronger password.');
      } else {
        setError(`Account creation failed: ${authError.message}`);
      }
    } else {
      setSuccess('Account created successfully! Please check your email to confirm your account before signing in.');
    }
    
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    clearError();
    
    const { error: authError } = await signInWithGoogle();

    if (authError) {
      setError(`Google sign-in failed: ${authError.message}. Please try again or use email/password.`);
      setIsLoading(false);
    }
    // If successful, the redirect will handle the rest
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'none': return 'bg-muted';
      case 'error': return 'bg-destructive';
      default: return 'bg-warning';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-muted-foreground">Loading authentication...</p>
            <p className="text-xs text-muted-foreground">
              Last event: {debugInfo.lastEvent}
            </p>
            {debugInfo.lastError && (
              <p className="text-xs text-destructive">
                Error: {debugInfo.lastError}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TreePine className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-foreground">ArborQuant</h1>
          </div>
          <p className="text-muted-foreground">Knowledge Base & Risk Assessment</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to access your ArborQuant dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Continue with Google'
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join ArborQuant to access our knowledge base and assessment tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Sign up with Google'
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      name="displayName"
                      type="text"
                      placeholder="Your Name"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••••••"
                      required
                      minLength={12}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 12 characters long
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>

          {(error || debugInfo.lastError) && (
            <div className="px-6 pb-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {error || debugInfo.lastError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {success && (
            <div className="px-6 pb-4">
              <Alert className="border-success bg-success/10">
                <AlertDescription className="text-success-foreground">
                  {success}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Enhanced Debug Panel */}
          <div className="px-6 pb-6">
            <Collapsible open={showDebug} onOpenChange={setShowDebug}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <span>Debug Info</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={`ml-2 ${getStatusColor(debugInfo.sessionStatus)}`}>
                      {debugInfo.sessionStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Event:</span>
                    <span className="ml-2 font-mono">{debugInfo.lastEvent}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OAuth Attempts:</span>
                    <span className="ml-2">{debugInfo.oauthAttempts}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Popup:</span>
                    <span className="ml-2">{debugInfo.popupStatus || 'none'}</span>
                  </div>
                </div>
                {debugInfo.lastError && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Last Error:</span>
                    <div className="mt-1 p-2 bg-destructive/10 rounded text-destructive font-mono">
                      {debugInfo.lastError}
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>By signing up, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </div>
  );
}