import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Download, Hash, StickyNote, Clock, Trash2, Edit3, Plus } from 'lucide-react';

interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  tags: string[];
  notes: string | null;
  created_at: string;
}

interface SaveCalculationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: { expression: string; result: string } | null;
  onSave: (tags: string[], notes: string) => void;
}

const SaveCalculationDialog = ({ isOpen, onClose, calculation, onSave }: SaveCalculationDialogProps) => {
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [context, setContext] = useState('');

  const handleSave = () => {
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const fullNotes = [notes, context].filter(n => n.trim()).join('\n\nContext: ');
    onSave(tagsArray, fullNotes);
    setTags('');
    setNotes('');
    setContext('');
    onClose();
  };

  const handleClose = () => {
    setTags('');
    setNotes('');
    setContext('');
    onClose();
  };

  if (!calculation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Calculation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-mono text-sm">
              <span>{calculation.expression}</span>
              <span className="mx-2 text-primary">=</span>
              <span className="font-semibold text-primary">{calculation.result}</span>
            </p>
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., work, taxes, budget"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this calculation..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="context">Context (What was this calculation for?)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Planning monthly budget, calculating tip for dinner, figuring out loan payments..."
              className="mt-1"
              rows={2}
            />
          </div>
          
          <Separator />
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CalculatorHistoryProps {
  onCalculationSave: (expression: string, result: string) => void;
  triggerSave?: { expression: string; result: string } | null;
}

export const CalculatorHistory = ({ onCalculationSave, triggerSave }: CalculatorHistoryProps) => {
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentCalculation, setCurrentCalculation] = useState<{ expression: string; result: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // Handle external save requests
  useEffect(() => {
    if (triggerSave) {
      setCurrentCalculation(triggerSave);
      setSaveDialogOpen(true);
    }
  }, [triggerSave]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('calculation_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load calculation history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCalculation = async (tags: string[], notes: string) => {
    if (!currentCalculation || !user) return;

    try {
      const { error } = await supabase
        .from('calculation_history')
        .insert({
          user_id: user.id,
          expression: currentCalculation.expression,
          result: currentCalculation.result,
          tags: tags,
          notes: notes.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Calculation saved to history"
      });

      setCurrentCalculation(null);
      fetchHistory();
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: "Error",
        description: "Failed to save calculation",
        variant: "destructive"
      });
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calculation_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Calculation deleted"
      });

      fetchHistory();
    } catch (error) {
      console.error('Error deleting calculation:', error);
      toast({
        title: "Error",
        description: "Failed to delete calculation",
        variant: "destructive"
      });
    }
  };

  const exportHistory = () => {
    const csvContent = [
      ['Expression', 'Result', 'Tags', 'Notes', 'Date'],
      ...history.map(calc => [
        calc.expression,
        calc.result,
        calc.tags.join(', '),
        calc.notes || '',
        new Date(calc.created_at).toLocaleString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bohocalc-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "History exported successfully"
    });
  };

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
      <Card className="w-full shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Calculation History
            </CardTitle>
            <Button 
              onClick={exportHistory} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={history.length === 0}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No calculations saved yet.</p>
              <p className="text-sm">Save calculations to see them here!</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {history.map((calc) => (
                  <div 
                    key={calc.id} 
                    className="group bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-mono text-sm">
                          <span className="text-gray-600">{calc.expression}</span>
                          <span className="mx-2 text-primary">=</span>
                          <span className="font-semibold text-primary">{calc.result}</span>
                        </div>
                        
                        {calc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {calc.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Hash className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {calc.notes && (
                          <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border-l-4 border-primary/30">
                            <div className="whitespace-pre-wrap">{calc.notes}</div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(calc.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => deleteCalculation(calc.id)}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <SaveCalculationDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        calculation={currentCalculation}
        onSave={saveCalculation}
      />
    </>
  );
};