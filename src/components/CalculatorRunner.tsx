import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, ArrowLeft, Star, Users, Save, Play } from 'lucide-react';
import { evaluate } from 'mathjs';

interface Variable {
  name: string;
  label: string;
  type: string;
  defaultValue: number;
  unit?: string;
}

interface Calculator {
  id: string;
  name: string;
  description: string;
  formula: string;
  variables: Variable[];
  category: string;
  is_public: boolean;
  is_anonymous: boolean;
  usage_count: number;
  rating_avg: number;
  rating_count: number;
  creator_id: string | null;
  created_at: string;
}

interface CalculatorRunnerProps {
  calculator: Calculator;
  onBack: () => void;
}

export const CalculatorRunner = ({ calculator, onBack }: CalculatorRunnerProps) => {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize inputs with default values
    const initialInputs: Record<string, number> = {};
    calculator.variables.forEach(variable => {
      initialInputs[variable.name] = variable.defaultValue;
    });
    setInputs(initialInputs);
  }, [calculator]);

  const calculateResult = () => {
    try {
      setError(null);
      
      // Replace variables in formula with actual values
      let formula = calculator.formula;
      calculator.variables.forEach(variable => {
        const value = inputs[variable.name] || 0;
        formula = formula.replace(new RegExp(`\\b${variable.name}\\b`, 'g'), value.toString());
      });

      const calculatedResult = evaluate(formula);
      setResult(calculatedResult.toString());
      
      // Record usage
      recordUsage(calculatedResult.toString());
      
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Error in calculation. Please check your inputs.');
      setResult(null);
    }
  };

  const recordUsage = async (result: string) => {
    try {
      // Record the usage
      await supabase
        .from('calculator_usage')
        .insert({
          calculator_id: calculator.id,
          user_id: user?.id || null,
          inputs: inputs,
          result: result
        });

      // Update usage count
      await supabase
        .from('calculators')
        .update({ usage_count: calculator.usage_count + 1 })
        .eq('id', calculator.id);

    } catch (error) {
      console.error('Error recording usage:', error);
    }
  };

  const saveToHistory = async () => {
    if (!result || !user) {
      toast({
        title: "Error",
        description: !user ? "Please login to save results" : "No result to save",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const expression = `${calculator.name}: ${calculator.variables.map(v => `${v.label}=${inputs[v.name]}`).join(', ')}`;
      
      await supabase
        .from('calculation_history')
        .insert({
          user_id: user.id,
          expression: expression,
          result: result,
          tags: [calculator.category, calculator.name],
          notes: `Calculated using ${calculator.name}`
        });

      toast({
        title: "Success!",
        description: "Result saved to your history"
      });
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({
        title: "Error",
        description: "Failed to save result",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const submitRating = async () => {
    if (!user || userRating === 0) return;

    try {
      await supabase
        .from('calculator_ratings')
        .upsert({
          calculator_id: calculator.id,
          user_id: user.id,
          rating: userRating
        });

      toast({
        title: "Success!",
        description: "Rating submitted"
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{calculator.name}</h2>
          <p className="text-muted-foreground">{calculator.description}</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary">{calculator.category}</Badge>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {calculator.usage_count} uses
            </span>
            {calculator.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                {calculator.rating_avg} ({calculator.rating_count})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="shadow-[var(--shadow-warm)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculator.variables.map((variable) => (
              <div key={variable.name}>
                <Label htmlFor={variable.name}>
                  {variable.label} {variable.unit && `(${variable.unit})`}
                </Label>
                <Input
                  id={variable.name}
                  type="number"
                  value={inputs[variable.name] || ''}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    [variable.name]: parseFloat(e.target.value) || 0
                  }))}
                  className="mt-1"
                />
              </div>
            ))}
            
            <Separator />
            
            <Button 
              onClick={calculateResult} 
              className="w-full flex items-center gap-2 bg-gradient-to-r from-primary to-accent"
            >
              <Play className="w-4 h-4" />
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="shadow-[var(--shadow-warm)]">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            
            {result && (
              <>
                <div className="p-6 bg-gradient-to-r from-muted to-muted/80 rounded-xl border border-border/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{result}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formula: {calculator.formula}
                    </p>
                  </div>
                </div>
                
                {user && (
                  <Button 
                    onClick={saveToHistory} 
                    disabled={saving}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save to History'}
                  </Button>
                )}
              </>
            )}
            
            <Separator />
            
            {/* Rating Section */}
            {user && (
              <div className="space-y-3">
                <Label>Rate this calculator</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => {
                        setUserRating(star);
                        setTimeout(submitRating, 100);
                      }}
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= userRating 
                            ? 'fill-current text-yellow-500' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formula Display */}
      <Card className="shadow-[var(--shadow-warm)]">
        <CardHeader>
          <CardTitle>Formula Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm font-mono">{calculator.formula}</code>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Variables:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {calculator.variables.map((variable) => (
                <div key={variable.name} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-mono text-sm">{variable.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {variable.label} {variable.unit && `(${variable.unit})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};