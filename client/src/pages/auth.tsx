import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wallet, IndianRupee, DollarSign, Moon, Sun, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [loginPin, setLoginPin] = useState("");
  const [registerPin, setRegisterPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("USD");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (loginPin.length !== 4) {
      toast({ variant: "destructive", title: "Please enter a 4-digit PIN" });
      return;
    }
    setIsLoading(true);
    const result = await login(loginPin);
    setIsLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: result.error || "Login failed" });
      setLoginPin("");
    }
  };

  const handleRegister = async () => {
    if (registerPin.length !== 4) {
      toast({ variant: "destructive", title: "Please enter a 4-digit PIN" });
      return;
    }
    if (registerPin !== confirmPin) {
      toast({ variant: "destructive", title: "PINs do not match" });
      return;
    }
    setIsLoading(true);
    const result = await register(registerPin, currency);
    setIsLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: result.error || "Registration failed" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SpendWise</h1>
          <p className="text-muted-foreground mt-2">Track your spending with ease</p>
        </div>

        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Access</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">New Account</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0 space-y-6">
                <div className="text-center">
                  <CardTitle className="text-xl mb-2">Enter Your PIN</CardTitle>
                  <CardDescription>Use your 4-digit PIN to access your spending data</CardDescription>
                </div>
                <PinInput value={loginPin} onChange={setLoginPin} disabled={isLoading} />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleLogin}
                  disabled={loginPin.length !== 4 || isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accessing...
                    </>
                  ) : (
                    "Access My Data"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="mt-0 space-y-6">
                <div className="text-center">
                  <CardTitle className="text-xl mb-2">Create Your PIN</CardTitle>
                  <CardDescription>Set up a 4-digit PIN to secure your data</CardDescription>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 text-center">Enter PIN</p>
                    <PinInput value={registerPin} onChange={setRegisterPin} disabled={isLoading} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 text-center">Confirm PIN</p>
                    <PinInput value={confirmPin} onChange={setConfirmPin} disabled={isLoading} />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3 text-center">Preferred Currency</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={currency === "USD" ? "default" : "outline"}
                      onClick={() => setCurrency("USD")}
                      className="h-12"
                      data-testid="button-currency-usd"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      US Dollars
                    </Button>
                    <Button
                      type="button"
                      variant={currency === "INR" ? "default" : "outline"}
                      onClick={() => setCurrency("INR")}
                      className="h-12"
                      data-testid="button-currency-inr"
                    >
                      <IndianRupee className="mr-2 h-4 w-4" />
                      Rupees
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRegister}
                  disabled={registerPin.length !== 4 || confirmPin.length !== 4 || isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Your PIN allows you to access your data from any device
        </p>
      </div>
    </div>
  );
}
