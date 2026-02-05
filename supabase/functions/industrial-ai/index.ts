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
    // ABSOLUTE DETERMINISM: temperature=0, topP=1, topK=1
    const defaultModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.0, // CRITICAL: No creativity for time measurement
        topP: 1.0,  // Maximum determinism
        topK: 1     // Only consider top choice
      }
    });

    if (action === "analyze") {
      console.log("Processing 'analyze' action...");
      const { files, mode, lang } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing or invalid 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are a DETERMINISTIC TIME CALCULATOR (NOT a flexible estimator).
      
      ABSOLUTE DETERMINISM RULE:
      If you analyze the SAME video twice, you MUST produce IDENTICAL times. Zero variance tolerated.
      
      PHASE 1 - INDUSTRY DETECTION:
      Identify sector from visual indicators:
      - Textile/Garment: Sewing machines, fabric, thread
      - Metalworking/CNC: Metal parts, chips, coolant, machine tools
      - Assembly: Multiple components, fasteners, stations
      - Food/Packaging: Food products, packaging materials
      - General Manufacturing: Other operations
      
      PHASE 2 - FIXED TIME LOOKUP TABLE (NO RANGES):
      
      TEXTILE/GARMENT:
      - Reach/grasp small item: 1.50s (FIXED)
      - Pick and position fabric: 2.50s (FIXED)
      - Sewing operation (manual): 3.00s (FIXED)
      - Machine cycle (auto): 6.00s (FIXED)
      
      METALWORKING/CNC:
      - Tool change: 4.00s (FIXED)
      - Part positioning: 3.00s (FIXED)
      - Manual operation: 6.00s (FIXED)
      - Machine cycle (auto): 30.00s (FIXED)
      
      ASSEMBLY:
      - Reach/grasp component: 1.25s (FIXED)
      - Position and fasten: 3.50s (FIXED)
      - Tool operation: 4.50s (FIXED)
      - Station transfer: 3.00s (FIXED)
      
      FOOD/PACKAGING:
      - Pick item: 0.75s (FIXED)
      - Place/position: 1.00s (FIXED)
      - Packaging operation: 2.00s (FIXED)
      - Machine cycle: 3.00s (FIXED)
      
      GENERAL MANUFACTURING:
      - Simple reach/grasp: 1.50s (FIXED)
      - Pick and position: 2.75s (FIXED)
      - Manual operation: 4.00s (FIXED)
      - Machine cycle: 7.50s (FIXED)
      
      CRITICAL RULES:
      1. IDENTICAL VIDEO = IDENTICAL OUTPUT. No exceptions.
      2. Count visible motions. Break into elements. Assign EXACT time from table above.
      3. Do NOT interpolate. Do NOT use decimals other than those listed.
      4. Sum exactly. observed_time = mathematical SUM of all elements.
      
      FORBIDDEN:
      - Using any time value not in the fixed table above
      - Creating custom times
      - Rounding or approximating
      
      STRICT OUTPUT (JSON):
      {
        "operation_name": "string",
        "technical_specs": { 
          "machine": "string (EXACT BRAND if visible)", 
          "material": "string",
          "rpm_speed": "string"
        },
        "cycle_analysis": [
          { "element": "string", "time_seconds": number (EXACT, 2 decimals), "value_added": boolean, "therblig": "string" }
        ],
        "time_calculation": {
          "observed_time": number (EXACT SUM of cycle_analysis times),
          "normal_time": number (= observed_time * rating_factor, CRITICAL: must NOT be 0),
          "rating_factor": number (default 1.0 unless operator visibly slow/fast),
          "allowances_pfd": number (0.15 standard),
          "standard_time": number (= normal_time * (1 + allowances_pfd)),
          "units_per_hour": number (= 3600 / standard_time)
        },
        "quality_audit": {
          "risk_level": "Low" | "Medium" | "High" | "Critical",
          "potential_defects": ["string"],
          "poka_yoke_opportunity": "string",
          "iso_compliance": "string"
        },
        "ergo_vitals": {
          "overall_risk_score": number,
          "posture_score": number,
          "force_score": number,
          "repetition_score": number,
          "critical_body_part": "string",
          "recommendation": "string"
        },
        "waste_analysis": {
          "waste_type": "string",
          "environmental_impact": "string",
          "disposal_recommendation": "string",
          "sustainability_score": number
        },
        "improvements": [
          { 
            "methodology": "string",
            "issue": "string",
            "recommendation": "string", 
            "impact": "string",
            "roi_potential": "string" 
          }
        ],
        "summary_text": "string"
      }
      
      CALCULATION VERIFICATION:
      - observed_time = SUM(all cycle_analysis.time_seconds)
      - normal_time = observed_time × rating_factor
      - standard_time = normal_time × (1 + allowances_pfd)
      
      Language: ${lang || 'es'}. ADAPT TO DETECTED INDUSTRY.`;

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
