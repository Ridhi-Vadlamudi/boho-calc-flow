import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator } from '@/components/Calculator';

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
    <div className="min-h-screen bg-background p-4">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">BohoCalc</h1>
          <p className="text-muted-foreground">Hello, {user.email}!</p>
        </div>
        <Button onClick={signOut} variant="outline">
          Sign Out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Calculator</h2>
            <Calculator />
          </div>

          {/* History Section - Coming Soon */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Calculation History</h2>
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-muted-foreground">History tracking coming soon!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
