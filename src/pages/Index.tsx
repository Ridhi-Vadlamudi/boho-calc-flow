import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator } from '@/components/Calculator';
import { CalculatorHistory } from '@/components/CalculatorHistory';

const Index = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream/20 to-sage/10 p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-terracotta/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-dusty-rose/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-sage/10 rounded-full blur-2xl"></div>
      </div>

      <header className="relative max-w-6xl mx-auto mb-8 text-center">
        <div className="bg-gradient-to-r from-card/80 to-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-[var(--shadow-warm)] border border-border/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-terracotta to-dusty-rose bg-clip-text text-transparent mb-2">
            BohoCalc
          </h1>
          <p className="text-muted-foreground mb-4">Your mindful calculation companion</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <Button onClick={signOut} variant="outline" className="border-primary/30 hover:bg-primary/10">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-r from-terracotta to-dusty-rose rounded-full flex items-center justify-center text-white text-sm">✦</span>
                Calculator
              </h2>
              <p className="text-muted-foreground text-sm">Perform calculations with mindful intention</p>
            </div>
            <Calculator />
          </div>

          {/* History Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-r from-sage to-golden rounded-full flex items-center justify-center text-white text-sm">✧</span>
                History & Notes
              </h2>
              <p className="text-muted-foreground text-sm">Track and organize your calculations</p>
            </div>
            <CalculatorHistory onCalculationSave={() => {}} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
