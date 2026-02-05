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

      const systemPrompt = `You are a Certified Master Industrial Engineer (MTM/MODAPTS & Lean Six Sigma Black Belt). 
      ROLE: Perform a forensic-level analysis of manufacturing video frames.
      
      CORE DIRECTIVES:
      1. TIME PRECISION (CRITICAL): Use MTM-2 or MODAPTS principles to assign standard times to motions. Do NOT guess. Be DETERMINISTIC. Same motions must yield exactly same times.
      2. QUALITY: Inspect for "Zero Defects". Reference specific ISO-9001 clauses.
      3. ERGONOMICS: Apply RULA/REBA principles for risk assessment.
      4. WASTE: Identify the "7 Wastes of Lean" (Muda) aggressively.
      
      STRICT OUTPUT: You must respond with a VALID JSON matching exactly this schema:
      {
        "operation_name": "string (Technical process name)",
        "technical_specs": { 
          "machine": "string (IDENTIFY SPECIFIC BRAND & MODEL if visible, e.g. Juki DDL-8700, Haas VF-2)", 
          "material": "string (Specific material type)",
          "rpm_speed": "string (Calculate/Estimate technical speed)"
        },
        "cycle_analysis": [
          { "element": "string (Use standard engineering terminology)", "time_seconds": number (Precision to 2 decimals), "value_added": boolean, "therblig": "string (Specific Therblig code)" }
        ],
        "time_calculation": {
          "observed_time": number (Sum of elements),
          "rating_factor": number (Evaluate pace: 0.8-1.2),
          "allowances_pfd": number (Standard industrial allowances, e.g. 0.15),
          "standard_time": number (observed * rating * (1+allowances)),
          "units_per_hour": number
        },
        "quality_audit": {
          "risk_level": "Low" | "Medium" | "High" | "Critical",
          "potential_defects": ["string (Specific defect types possible)"],
          "poka_yoke_opportunity": "string (Engineering control suggestion)",
          "iso_compliance": "string (Relevant ISO clause)"
        },
        "ergo_vitals": {
          "overall_risk_score": number (1-10, based on RULA),
          "posture_score": number,
          "force_score": number,
          "repetition_score": number,
          "critical_body_part": "string",
          "recommendation": "string (Biomechanical correction)"
        },
        "waste_analysis": {
          "waste_type": "string (e.g. Motion, Transport, Waiting)",
          "environmental_impact": "Low" | "Medium" | "High",
          "disposal_recommendation": "string",
          "sustainability_score": number (1-10)
        },
        "improvements": [
          { 
            "methodology": "Process" | "Optimization" | "Ergonomics" | "Quality",
            "issue": "string",
            "recommendation": "string (Technical improvement)", 
            "impact": "string (Quantifiable benefit)",
            "roi_potential": "string (e.g. 'High - <3 months')" 
          }
        ],
        "summary_text": "string (Professional engineering summary)"
      }
      
      INSTRUCTIONS:
      1. Analyze the provided images as a sequence.
      2. APPLY MTM STANDARDS. If a hand moves ~30cm, that is a specific time code. Be consistent.
      3. Populate ALL fields. 
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

      const systemPrompt = `You are an Elite Manufacturing Optimization Consultant. 
      ROLE: Analyze visual evidence to propose a STATE-OF-THE-ART layout and method transformation.
      
      CRITICAL INSTRUCTION - VISUAL ACCURACY:
      1. ANALYZE the video to identify the EXACT Machine Brand (e.g., Jack, Juki, Brother), Model, and specific Operation (e.g., "Sewing Button", "Overlock", "CNC Milling").
      2. The "image_prompt" you generate MUST be specific to this equipment. Do not generate generic machines if a specific brand is visible.
      
      STRICT OUTPUT: Respond ONLY with a VALID JSON matching this schema:
      {
        "current_method_issues": ["string (List of specific inefficiencies found)"],
        "efficiency_loss_percentage": number (Scientific estimate),
        "layout_strategy": "string (e.g. 'U-Shaped Cellular Layout' or 'One-Piece Flow')",
        "key_changes": ["string (List of engineering changes)"],
        "estimated_time_reduction": "string",
        "image_prompt": "string (Photorealistic prompt for the NEW layout. STRUCTURE: '[Specific Machine Brand & Model] performing [Specific Operation] in a [New Layout Type]. [Details of improvement]. Professional lighting. High resolution.' IMPORTANT: 1. Use the exact machine brand seen (e.g. 'Jack sewing machine'). 2. Integrate text 'IA-AGUS.COM' subtly on a display or wall.)"
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
