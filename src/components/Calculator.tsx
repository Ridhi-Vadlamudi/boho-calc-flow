import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface CalculatorProps {
  onSaveCalculation?: (expression: string, result: string) => void;
}

export const Calculator = ({ onSaveCalculation }: CalculatorProps) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastExpression, setLastExpression] = useState('');

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = performCalculation(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const performCalculation = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const calculate = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = performCalculation(previousValue, inputValue, operation);
      const expression = `${previousValue} ${operation} ${inputValue}`;
      
      setDisplay(String(newValue));
      setLastExpression(expression);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setLastExpression('');
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const saveCurrentCalculation = () => {
    if (lastExpression && display !== '0' && onSaveCalculation) {
      onSaveCalculation(lastExpression, display);
    }
  };

  const buttons = [
    { label: 'C', action: clear, className: 'col-span-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground' },
    { label: '⌫', action: () => setDisplay(display.slice(0, -1) || '0'), className: 'bg-muted hover:bg-muted/90 text-foreground' },
    { label: '÷', action: () => inputOperation('÷'), className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    
    { label: '7', action: () => inputNumber('7'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '8', action: () => inputNumber('8'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '9', action: () => inputNumber('9'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '×', action: () => inputOperation('×'), className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    
    { label: '4', action: () => inputNumber('4'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '5', action: () => inputNumber('5'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '6', action: () => inputNumber('6'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '-', action: () => inputOperation('-'), className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    
    { label: '1', action: () => inputNumber('1'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '2', action: () => inputNumber('2'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '3', action: () => inputNumber('3'), className: 'bg-card hover:bg-muted text-foreground' },
    { label: '+', action: () => inputOperation('+'), className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    
    { label: '0', action: () => inputNumber('0'), className: 'col-span-2 bg-card hover:bg-muted text-foreground' },
    { label: '.', action: inputDecimal, className: 'bg-card hover:bg-muted text-foreground' },
    { label: '=', action: calculate, className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },
  ];

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-sm mx-auto shadow-lg bg-white border-2">
        <CardContent className="p-6 space-y-4">
          {/* Display */}
          <div className="bg-gray-100 rounded-xl p-4 min-h-[80px] flex items-center justify-end border">
            <span className="text-2xl font-mono font-bold text-right break-all text-gray-900">
              {display}
            </span>
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-4 gap-3">
            {buttons.map((button, index) => (
              <Button
                key={index}
                onClick={button.action}
                className={`h-12 text-lg font-semibold transition-all duration-300 hover:scale-105 ${button.className}`}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      {lastExpression && (
        <div className="flex justify-center">
          <Button 
            onClick={saveCurrentCalculation}
            variant="outline"
            className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
          >
            <Save className="w-4 h-4" />
            Save Calculation
          </Button>
        </div>
      )}
    </div>
  );
};