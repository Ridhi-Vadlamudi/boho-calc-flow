import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userInput } = await req.json();

    const systemPrompt = `You are an expert calculator creator. Create a calculator based on the user's request. 

IMPORTANT GUIDELINES:
- Use math.js syntax for formulas (e.g., "sqrt(x)", "pow(x, 2)", "sin(x)", etc.)
- Variables should be named clearly (e.g., "principal", "rate", "time", not "x", "y", "z")
- Provide a clear description of what the calculator does
- Include proper variable labels and units where applicable
- Suggest a good category (e.g., "Finance", "Physics", "Math", "Health", "Engineering")

Return a JSON object with this exact structure:
{
  "name": "Calculator Name",
  "description": "Clear description of what this calculator does",
  "formula": "math.js compatible formula using variable names",
  "variables": [
    {
      "name": "variableName",
      "label": "Human readable label",
      "type": "number",
      "defaultValue": 0,
      "unit": "optional unit like $, %, kg, etc"
    }
  ],
  "category": "Category name"
}

Example for compound interest:
{
  "name": "Compound Interest Calculator",
  "description": "Calculate compound interest over time",
  "formula": "principal * pow(1 + rate/100, time)",
  "variables": [
    {"name": "principal", "label": "Principal Amount", "type": "number", "defaultValue": 1000, "unit": "$"},
    {"name": "rate", "label": "Annual Interest Rate", "type": "number", "defaultValue": 5, "unit": "%"},
    {"name": "time", "label": "Time Period", "type": "number", "defaultValue": 10, "unit": "years"}
  ],
  "category": "Finance"
}`;

    console.log('Making OpenAI API request with prompt:', prompt);
    
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY in Supabase secrets'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${prompt}${userInput ? ` Additional details: ${userInput}` : ''}` }
        ],
        temperature: 0.7,
      }),
    });

    console.log('OpenAI API response status:', response.status);
    const data = await response.json();
    console.log('OpenAI API response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(JSON.stringify({ 
        error: 'OpenAI API request failed',
        details: data.error?.message || 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI API',
        details: 'Response missing expected choices structure'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedContent = data.choices[0].message.content;

    // Try to extract JSON from the response
    let calculatorData;
    try {
      console.log('Generated content:', generatedContent);
      
      // Look for JSON in the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON match:', jsonMatch[0]);
        calculatorData = JSON.parse(jsonMatch[0]);
        console.log('Parsed calculator data:', calculatorData);
      } else {
        console.error('No JSON found in response');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', generatedContent);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response. The AI did not return valid JSON.',
        rawResponse: generatedContent,
        details: parseError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      calculatorData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-calculator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});