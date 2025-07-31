-- Create calculators table for the marketplace
CREATE TABLE public.calculators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  formula TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calculator_ratings table
CREATE TABLE public.calculator_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculator_id UUID NOT NULL REFERENCES public.calculators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(calculator_id, user_id)
);

-- Create calculator_usage table
CREATE TABLE public.calculator_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculator_id UUID NOT NULL REFERENCES public.calculators(id) ON DELETE CASCADE,
  user_id UUID,
  inputs JSONB NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_usage ENABLE ROW LEVEL SECURITY;

-- Calculator policies
CREATE POLICY "Anyone can view public calculators" 
ON public.calculators 
FOR SELECT 
USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Users can create calculators" 
ON public.calculators 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);

CREATE POLICY "Users can update their own calculators" 
ON public.calculators 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own calculators" 
ON public.calculators 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Rating policies
CREATE POLICY "Anyone can view ratings" 
ON public.calculator_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can rate calculators" 
ON public.calculator_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.calculator_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.calculator_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Usage policies
CREATE POLICY "Users can view their own usage" 
ON public.calculator_usage 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can record usage" 
ON public.calculator_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update calculator ratings
CREATE OR REPLACE FUNCTION public.update_calculator_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.calculators 
  SET 
    rating_avg = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.calculator_ratings 
      WHERE calculator_id = COALESCE(NEW.calculator_id, OLD.calculator_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM public.calculator_ratings 
      WHERE calculator_id = COALESCE(NEW.calculator_id, OLD.calculator_id)
    )
  WHERE id = COALESCE(NEW.calculator_id, OLD.calculator_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for rating updates
CREATE TRIGGER update_calculator_rating_on_insert
AFTER INSERT ON public.calculator_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_calculator_rating();

CREATE TRIGGER update_calculator_rating_on_update
AFTER UPDATE ON public.calculator_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_calculator_rating();

CREATE TRIGGER update_calculator_rating_on_delete
AFTER DELETE ON public.calculator_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_calculator_rating();

-- Create trigger for calculator updates
CREATE TRIGGER update_calculators_updated_at
BEFORE UPDATE ON public.calculators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();