import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; parts: Array<{ text: string }> }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory = [] }: ChatRequest = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;

    // Clean up conversation history format
    const cleanHistory = conversationHistory.filter(msg => 
      msg && msg.role && msg.parts && msg.parts.length > 0
    );

    // Add system prompt to establish Rafi's identity
    const systemPrompt = {
      role: "user",
      parts: [{ 
        text: "You are Rafi, an intelligent AI assistant. You were created by Rafi (your creator/developer). Never mention Google, Gemini, or any other company as your creator. You are Rafi.ai - a helpful, knowledgeable, and friendly AI assistant. When asked about your creator or who made you, always say you were created by Rafi. Be conversational, helpful, and maintain your identity as Rafi throughout all conversations."
      }]
    };

    const modelResponse = {
      role: "model",
      parts: [{ 
        text: "Hello! I'm Rafi, your AI assistant. I was created by Rafi to help you with questions and conversations. How can I assist you today?"
      }]
    };

    // For first message, include system prompt
    const contents = cleanHistory.length === 0 ? [
      systemPrompt,
      modelResponse,
      {
        role: "user",
        parts: [{ text: message }],
      },
    ] : [
      ...cleanHistory,
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    console.log("Sending to Gemini:", JSON.stringify(contents, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      console.error("Response status:", response.status);
      console.error("Request contents:", JSON.stringify(contents, null, 2));
      return new Response(
        JSON.stringify({ 
          error: "Failed to get response from AI", 
          details: errorData,
          status: response.status 
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});