import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, payload } = body;
    console.log(`Action received: ${action}`);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      throw new Error("GEMINI_API_KEY no configurada en Supabase.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.0-flash as requested for better performance
    const defaultModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    if (action === "analyze") {
      console.log("Processing 'analyze' action...");
      const { files, mode, lang } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing or invalid 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are an Advanced Industrial Engineering AI. 
      ROLE: Analyze manufacturing video frames and generate a detailed "Industrial Analysis" report.
      STRICT OUTPUT: You must respond with a VALID JSON matching exactly this schema:
      {
        "operation_name": "string (Name of the process)",
        "technical_specs": { 
          "machine": "string (Machine name/model)", 
          "material": "string (Material being worked on)",
          "rpm_speed": "string (Estimated speed if applicable)"
        },
        "cycle_analysis": [
          { "element": "string (e.g., Grasp Part)", "time_seconds": number, "value_added": boolean, "therblig": "string" }
        ],
        "time_calculation": {
          "observed_time": number (sum of cycle elements),
          "rating_factor": number (e.g., 1.10 for 110%),
          "allowances_pfd": number (e.g., 0.15 for 15%),
          "standard_time": number,
          "units_per_hour": number
        },
        "quality_audit": {
          "risk_level": "Low" | "Medium" | "High" | "Critical",
          "potential_defects": ["string"],
          "poka_yoke_opportunity": "string (Suggestion for error proofing)",
          "iso_compliance": "string (e.g. ISO 9001 Clause...)"
        },
        "ergo_vitals": {
          "overall_risk_score": number (1-10),
          "posture_score": number,
          "force_score": number,
          "repetition_score": number,
          "critical_body_part": "string",
          "recommendation": "string"
        },
        "waste_analysis": {
          "waste_type": "string",
          "environmental_impact": "Low" | "Medium" | "High",
          "disposal_recommendation": "string",
          "sustainability_score": number (1-10)
        },
        "improvements": [
          { 
            "methodology": "Process" | "Optimization" | "Ergonomics" | "Quality",
            "issue": "string",
            "recommendation": "string", 
            "impact": "string",
            "roi_potential": "string" 
          }
        ],
        "summary_text": "string (Executive summary of the analysis)"
      }
      
      INSTRUCTIONS:
      1. Analyze the provided images as a sequence.
      2. Estimate times deterministically based on typical industrial standards if timestamps are not explicit.
      3. Populate ALL fields. Do not leave nulls. If data is unclear, estimate conservatively.
      4. Language: ${lang || 'es'}.`;

      const userPrompt = `Analyze this operation of ${mode || 'manufacturing'}. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
        ...parts
      ]);

      const text = result.response.text();
      console.log("AI Analysis response received.");

      return new Response(JSON.stringify({ result: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "improve_method") {
      console.log("Processing 'improve_method' action...");
      const { files, mode, lang } = payload || {};
      if (!files) throw new Error("Missing 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are a Senior Industrial Method Engineer. 
      ROLE: Analyze visual evidence of a manufacturing process and propose a layout/method optimization.
      STRICT OUTPUT: Respond ONLY with a VALID JSON matching this schema:
      {
        "current_method_issues": ["string (List of detected inefficiencies)"],
        "efficiency_loss_percentage": number (Estimated % loss due to current method),
        "layout_strategy": "string (Name of the proposed layout, e.g. U-Shaped Cell)",
        "key_changes": ["string (List of specific changes to implement)"],
        "estimated_time_reduction": "string (e.g. '15-20%')",
        "image_prompt": "string (A detailed prompt to generate an image of the NEW improved layout. Describe it visually: 'Modern U-shaped assembly cell...'. IMPORTANT: Integrate the text 'IA-AGUS.COM' subtly in the scene, e.g. on a digital display, machine label, or wall)"
      }
      `;

      const userPrompt = `Analyze these frames of a ${mode || 'manufacturing'} operation and propose improvements. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([{ text: systemPrompt }, { text: userPrompt }, ...parts]);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chat-report" || action === "chat-support") {
      console.log(`Processing chat action: ${action}`);
      const { question, history = [], analysisContext, mode } = payload || {};

      if (!question) throw new Error("Missing 'question' in payload");

      const systemPrompt = action === "chat-report"
        ? `Eres un experto en manufactura e ingeniería industrial. HOY ES 4 DE FEBRERO DE 2026. Estás en la Expo Manufactura Monterrey 2026. 
           Analiza el siguiente contexto de operación y responde la pregunta del usuario considerando las tendencias actuales de 2026.
           CONTEXTO: ${analysisContext || "N/A"}. Modo: ${mode || "General"}`
        : `Eres el Help Desk de Manufactura IA Pro de IA.AGUS. HOY ES 4 DE FEBRERO DE 2026. Estás atendiendo desde la Expo Manufactura Monterrey 2026. 
           Eres un consultor experto en optimización de plantas y soporte técnico de la plataforma.`;

      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || "" }]
      }));

      const chat = defaultModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Entendido." }] },
          ...formattedHistory
        ]
      });

      const result = await chat.sendMessage(question);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "generate-layout-prompt" || action === "generate-video-prompt") {
      console.log(`Processing prompt generation: ${action}`);
      const { analysisText } = payload || {};
      const prompt = `Create a photorealistic industrial design prompt for: ${analysisText}`;
      const result = await defaultModel.generateContent(prompt);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.warn(`Unsupported action: ${action}`);
    return new Response(JSON.stringify({ error: `Acción '${action}' no soportada.` }), { status: 400, headers: corsHeaders });

  } catch (err) {
    console.error("Critical Edge Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
