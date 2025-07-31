import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator } from '@/components/Calculator';
import { CalculatorHistory } from '@/components/CalculatorHistory';
import { CalculatorMarketplace } from '@/components/CalculatorMarketplace';
import { CalculatorRunner } from '@/components/CalculatorRunner';
import { useState, useEffect } from 'react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [selectedCalculator, setSelectedCalculator] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'marketplace' | 'history'>('calculator');
  const [saveRequest, setSaveRequest] = useState<{ expression: string; result: string } | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('Active tab:', activeTab);
    console.log('Selected calculator:', selectedCalculator);
  }, [activeTab, selectedCalculator]);

  // Handle save calculation request
  const handleSaveCalculation = (expression: string, result: string) => {
    setSaveRequest({ expression, result });
    setActiveTab('history'); // Switch to history tab to show save dialog
    // Clear the save request after a short delay to prevent re-triggering
    setTimeout(() => setSaveRequest(null), 1000);
  };

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

  // Remove the redirect for guest browsing - allow users to browse marketplace without auth

  // Handle calculator selection from marketplace
  const handleCalculatorSelect = (calculator: any) => {
    setSelectedCalculator(calculator);
  };

  const handleBackToMarketplace = () => {
    setSelectedCalculator(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream/20 to-sage/10 p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-terracotta/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-dusty-rose/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-sage/10 rounded-full blur-2xl"></div>
      </div>

      <header className="relative max-w-7xl mx-auto mb-8 text-center">
        <div className="bg-gradient-to-r from-card/80 to-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-[var(--shadow-warm)] border border-border/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-terracotta to-dusty-rose bg-clip-text text-transparent mb-2">
            BohoCalc
          </h1>
          <p className="text-muted-foreground mb-4">Your mindful calculation companion & community marketplace</p>
          
          {user ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <Button onClick={signOut} variant="outline" className="border-primary/30 hover:bg-primary/10">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Browse calculators as a guest, or sign in to create and save your own!
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                className="bg-gradient-to-r from-terracotta to-dusty-rose hover:from-terracotta/90 hover:to-dusty-rose/90"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative max-w-7xl mx-auto mb-6">
        <div className="flex justify-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-1 shadow-[var(--shadow-soft)] border border-border/30">
            <div className="flex gap-1">
              <Button
                variant={activeTab === 'calculator' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('calculator')}
                className="flex items-center gap-2"
              >
                <span className="w-6 h-6 bg-gradient-to-r from-terracotta to-dusty-rose rounded-full flex items-center justify-center text-white text-xs">✦</span>
                Basic Calculator
              </Button>
              <Button
                variant={activeTab === 'marketplace' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('marketplace')}
                className="flex items-center gap-2"
              >
                <span className="w-6 h-6 bg-gradient-to-r from-sage to-golden rounded-full flex items-center justify-center text-white text-xs">⚡</span>
                Marketplace
              </Button>
              {user && (
                <Button
                  variant={activeTab === 'history' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-2"
                >
                  <span className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-xs">✧</span>
                  History
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto">
        {selectedCalculator ? (
          <CalculatorRunner 
            calculator={selectedCalculator} 
            onBack={handleBackToMarketplace} 
          />
        ) : (
          <>
            {activeTab === 'calculator' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Basic Calculator</h2>
                  <p className="text-muted-foreground text-sm">Perform simple calculations</p>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border">
                  <Calculator onSaveCalculation={handleSaveCalculation} />
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-6">
                <CalculatorMarketplace onSelectCalculator={handleCalculatorSelect} />
              </div>
            )}

            {activeTab === 'history' && user && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Calculation History</h2>
                  <p className="text-muted-foreground text-sm">Track and organize your calculations</p>
                </div>
                <CalculatorHistory 
                  onCalculationSave={() => {}} 
                  triggerSave={saveRequest}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
