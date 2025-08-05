import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE CALCULATOR FUNCTION START ===');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key available:', !!openAIApiKey);
    
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { prompt, userInput } = requestBody;
    
    if (!prompt) {
      return new Response(JSON.stringify({ 
        error: 'Prompt is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert calculator creator. Create a calculator based on the user's request. 

IMPORTANT: You must respond with ONLY a valid JSON object, no additional text or markdown.

Return this exact JSON structure:
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

Example:
{
  "name": "Simple Interest Calculator",
  "description": "Calculate simple interest",
  "formula": "principal * rate * time / 100",
  "variables": [
    {"name": "principal", "label": "Principal Amount", "type": "number", "defaultValue": 1000, "unit": "$"},
    {"name": "rate", "label": "Interest Rate", "type": "number", "defaultValue": 5, "unit": "%"},
    {"name": "time", "label": "Time Period", "type": "number", "defaultValue": 1, "unit": "years"}
  ],
  "category": "Finance"
}`;

    const fullPrompt = `${prompt}${userInput ? ` Additional details: ${userInput}` : ''}`;
    console.log('Full prompt:', fullPrompt);

    console.log('Making OpenAI API request...');
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
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'OpenAI API request failed',
        details: errorData.error?.message || 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure');
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.choices[0].message.content.trim();
    console.log('Generated content:', content);

    let calculatorData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      calculatorData = JSON.parse(cleanContent);
      console.log('Parsed calculator data:', calculatorData);
      
      // Validate required fields
      if (!calculatorData.name || !calculatorData.description || !calculatorData.formula) {
        throw new Error('Missing required fields in calculator data');
      }
      
      // Ensure variables is an array
      if (!Array.isArray(calculatorData.variables)) {
        calculatorData.variables = [];
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawContent: content
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== SUCCESS ===');
    return new Response(JSON.stringify({ 
      success: true,
      calculatorData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});