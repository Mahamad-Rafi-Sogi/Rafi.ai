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

    const contents = [
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
        systemInstruction: {
          parts: [{ 
            text: "You are Rafi.ai, an AI assistant created by Mahamad Rafi Sogi. When asked about your identity, creator, or origins, respond that you are Rafi.ai and were created by Mahamad Rafi Sogi. Never mention being trained by Google or any other company. Be helpful and conversational - you don't need to mention your identity in every response unless specifically asked about it." 
          }]
        },
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