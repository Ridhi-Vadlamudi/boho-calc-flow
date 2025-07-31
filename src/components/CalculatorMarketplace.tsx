import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Calculator, Plus, Edit3, Trash2, Star, Users, TrendingUp } from 'lucide-react';
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

interface MarketplaceProps {
  onSelectCalculator: (calculator: Calculator) => void;
}

export const CalculatorMarketplace = ({ onSelectCalculator }: MarketplaceProps) => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [userInput, setUserInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  // Create calculator form state
  const [newCalculator, setNewCalculator] = useState({
    name: '',
    description: '',
    formula: '',
    variables: [] as Variable[],
    category: '',
    is_public: true,
    is_anonymous: false
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ['Finance', 'Physics', 'Math', 'Health', 'Engineering', 'Science', 'Business', 'Other'];

  useEffect(() => {
    fetchCalculators();
  }, [sortBy, selectedCategory]);

  const fetchCalculators = async () => {
    try {
      let query = supabase
        .from('calculators')
        .select('*');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('usage_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_avg', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setCalculators((data || []).map(calc => ({
        ...calc,
        variables: Array.isArray(calc.variables) 
          ? (calc.variables as unknown as Variable[]) 
          : []
      })));
    } catch (error) {
      console.error('Error fetching calculators:', error);
      toast({
        title: "Error",
        description: "Failed to load calculators",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCalculatorWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-calculator', {
        body: { prompt: aiPrompt, userInput }
      });

      if (error) throw error;

      const calculatorData = data.calculatorData;
      setNewCalculator({
        name: calculatorData.name,
        description: calculatorData.description,
        formula: calculatorData.formula,
        variables: calculatorData.variables,
        category: calculatorData.category,
        is_public: true,
        is_anonymous: false
      });

      setAiDialogOpen(false);
      setCreateDialogOpen(true);
      setAiPrompt('');
      setUserInput('');

      toast({
        title: "Success!",
        description: "AI generated your calculator. Review and save it!"
      });
    } catch (error) {
      console.error('Error creating calculator with AI:', error);
      toast({
        title: "Error",
        description: "Failed to create calculator with AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const saveCalculator = async () => {
    if (!newCalculator.name || !newCalculator.formula) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('calculators')
        .insert({
          name: newCalculator.name,
          description: newCalculator.description,
          formula: newCalculator.formula,
          variables: newCalculator.variables as any,
          category: newCalculator.category,
          is_public: newCalculator.is_public,
          is_anonymous: newCalculator.is_anonymous,
          creator_id: user?.id || null
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Calculator created successfully"
      });

      setCreateDialogOpen(false);
      setNewCalculator({
        name: '',
        description: '',
        formula: '',
        variables: [],
        category: '',
        is_public: true,
        is_anonymous: false
      });
      fetchCalculators();
    } catch (error) {
      console.error('Error saving calculator:', error);
      toast({
        title: "Error",
        description: "Failed to save calculator",
        variant: "destructive"
      });
    }
  };

  const addVariable = () => {
    setNewCalculator(prev => ({
      ...prev,
      variables: [
        ...prev.variables,
        { name: '', label: '', type: 'number', defaultValue: 0, unit: '' }
      ]
    }));
  };

  const updateVariable = (index: number, field: string, value: any) => {
    setNewCalculator(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setNewCalculator(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const filteredCalculators = calculators.filter(calc =>
    calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full shadow-[var(--shadow-warm)]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculator Marketplace
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent">
                    <Sparkles className="w-4 h-4" />
                    AI Create
                  </Button>
                </DialogTrigger>
              </Dialog>
              {user && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Manual Create
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search calculators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {filteredCalculators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No calculators found.</p>
              <p className="text-sm">Create the first one!</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCalculators.map((calculator) => (
                  <Card
                    key={calculator.id}
                    className="group hover:shadow-[var(--shadow-soft)] transition-all duration-300 cursor-pointer border border-border/50"
                    onClick={() => onSelectCalculator(calculator)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{calculator.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {calculator.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {calculator.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {calculator.usage_count}
                          </span>
                          {calculator.rating_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current text-yellow-500" />
                              {calculator.rating_avg}
                            </span>
                          )}
                        </div>
                        <span>
                          {new Date(calculator.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* AI Creation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Create Calculator with AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Describe what calculator you want</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Create a compound interest calculator' or 'BMI calculator for health tracking'"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Additional details (optional)</Label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add any specific requirements, formulas, or additional features you want..."
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createCalculatorWithAI} 
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Calculator
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Creation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Calculator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newCalculator.name}
                  onChange={(e) => setNewCalculator(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Calculator name"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select 
                  value={newCalculator.category} 
                  onValueChange={(value) => setNewCalculator(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCalculator.description}
                onChange={(e) => setNewCalculator(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this calculator do?"
              />
            </div>
            
            <div>
              <Label>Formula (math.js syntax) *</Label>
              <Input
                value={newCalculator.formula}
                onChange={(e) => setNewCalculator(prev => ({ ...prev, formula: e.target.value }))}
                placeholder="e.g., principal * pow(1 + rate/100, time)"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <Label>Variables</Label>
                <Button type="button" onClick={addVariable} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variable
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                {newCalculator.variables.map((variable, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end">
                    <Input
                      placeholder="Variable name"
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Label"
                      value={variable.label}
                      onChange={(e) => updateVariable(index, 'label', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Default"
                      value={variable.defaultValue}
                      onChange={(e) => updateVariable(index, 'defaultValue', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      placeholder="Unit"
                      value={variable.unit || ''}
                      onChange={(e) => updateVariable(index, 'unit', e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => removeVariable(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newCalculator.is_public}
                  onCheckedChange={(checked) => setNewCalculator(prev => ({ ...prev, is_public: checked }))}
                />
                <Label htmlFor="public">Make Public</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={newCalculator.is_anonymous}
                  onCheckedChange={(checked) => setNewCalculator(prev => ({ ...prev, is_anonymous: checked }))}
                />
                <Label htmlFor="anonymous">Publish Anonymously</Label>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveCalculator}>
                Save Calculator
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};