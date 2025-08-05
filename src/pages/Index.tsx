import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator } from '@/components/Calculator';
import { CalculatorHistory } from '@/components/CalculatorHistory';
import { CalculatorMarketplace } from '@/components/CalculatorMarketplace';
import { CalculatorRunner } from '@/components/CalculatorRunner';
import { useState, useEffect } from 'react';
import { Leaf, Flower2, TreePine, Sparkles, Heart, Moon, Sun } from 'lucide-react';
import orangeFlowers from '@/assets/orange-flowers.jpg';
import sunThroughTrees from '@/assets/sun-through-trees.jpg';
import forestLight from '@/assets/forest-light.jpg';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Boho Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20">
          <img src={orangeFlowers} alt="" className="w-32 h-32 object-cover rounded-full" />
        </div>
        <div className="absolute top-20 right-20 opacity-15">
          <img src={sunThroughTrees} alt="" className="w-24 h-24 object-cover rounded-full" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-20">
          <img src={forestLight} alt="" className="w-28 h-28 object-cover rounded-full" />
        </div>
        
        {/* Floating Icons */}
        <Leaf className="absolute top-32 left-1/4 text-green-300 opacity-30 w-8 h-8 animate-pulse" />
        <Flower2 className="absolute top-40 right-1/3 text-orange-300 opacity-40 w-6 h-6 animate-pulse" />
        <TreePine className="absolute bottom-32 right-1/4 text-green-400 opacity-30 w-10 h-10 animate-pulse" />
        <Sparkles className="absolute top-1/2 left-16 text-yellow-300 opacity-40 w-5 h-5 animate-pulse" />
        <Heart className="absolute bottom-40 right-16 text-pink-300 opacity-30 w-7 h-7 animate-pulse" />
        <Moon className="absolute top-16 left-1/2 text-purple-300 opacity-30 w-6 h-6 animate-pulse" />
        <Sun className="absolute bottom-16 left-1/3 text-yellow-400 opacity-35 w-8 h-8 animate-pulse" />
      </div>

      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl"></div>
      </div>

      <header className="relative max-w-7xl mx-auto mb-8 text-center z-10 p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-200/50">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="text-green-500 w-8 h-8" />
            <h1 className="text-4xl font-bold text-gray-800">BohoCalc</h1>
            <Flower2 className="text-orange-400 w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <TreePine className="w-5 h-5 text-green-400" />
            <p className="text-lg">Your mindful calculation companion & community marketplace</p>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          
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
                <Leaf className="w-5 h-5 text-green-500" />
                Basic Calculator
              </Button>
              <Button
                variant={activeTab === 'marketplace' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('marketplace')}
                className="flex items-center gap-2"
              >
                <TreePine className="w-5 h-5 text-green-600" />
                Marketplace
              </Button>
              {user && (
                <Button
                  variant={activeTab === 'history' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-2"
                >
                  <Flower2 className="w-5 h-5 text-orange-500" />
                  History
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto z-10 px-4">
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
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-green-200/50 shadow-lg">
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
