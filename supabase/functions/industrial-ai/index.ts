import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
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

      const systemPrompt = `You are a FRAME-BY-FRAME VIDEO TIME ANALYST (NOT an estimator).
      
      CRITICAL METHOD:
      You will receive a SEQUENCE of video frames. Analyze them AS A TIMELINE, not as isolated images.
      
      PHASE 1 - DETECT INDUSTRY SECTOR:
      - Textile/Garment: Sewing machines, fabric, thread
      - Metalworking/CNC: Metal parts, chips, machine tools
      - Assembly: Components, fasteners, stations
      - Food/Packaging: Food products, packaging
      - General Manufacturing: Other operations
      
      PHASE 2 - ADVANCED INDUSTRIAL ANALYSIS:
      1. MOTION TRANSITIONS: IDENTIFY exactly when actions start/end.
      2. MUDA DISCOVERY (8 WASTES): Detect Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, and Unused Talent (Skills). Score each 0-10 (10 = High Waste).
      3. 5S VISUAL AUDIT: Evaluate Sort, Set in Order, Shine, Standardize, and Sustain. Score 1-5 (5 = Excellent).
      4. SAFETY COMPLIANCE: Audit PPE (Safety glasses, gloves, vest, helmets), detect trip hazards, and ergonomic danger zones.
      
      STRICT OUTPUT (JSON):
      {
        "operation_name": "string",
        "technical_specs": { 
          "machine": "string (EXACT BRAND)", 
          "material": "string",
          "rpm_speed": "string"
        },
        "cycle_analysis": [
          { 
            "element": "string", 
            "time_seconds": number,
            "frame_start": number,
            "frame_end": number,
            "value_added": boolean, 
            "therblig": "string" 
          }
        ],
        "time_calculation": {
          "observed_time": number,
          "normal_time": number,
          "rating_factor": number,
          "allowances_pfd": number,
          "standard_time": number,
          "units_per_hour": number
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
        "lean_metrics": {
          "muda_scores": {
            "transport": number, "inventory": number, "motion": number, "waiting": number,
            "overproduction": number, "overprocessing": number, "defects": number, "skills": number
          },
          "five_s_audit": {
            "seiri": number, "seiton": number, "seiso": number, "seiketsu": number, "shitsuke": number, "overall": number
          },
          "kaizen_blitz_goals": ["string"],
          "takt_time_alignment": "string"
        },
        "safety_audit": {
          "ppe_detected": ["string"],
          "ppe_missing": ["string"],
          "hazard_zones_violations": number,
          "safety_score": number
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
        "summary_text": "string",
        "image_prompt": "string"
      }
      
      Language: ${lang || 'es'}. ANALYZE FRAME SEQUENCE DETERMINISTICALLY.`;

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
      const { files, mode, lang, promptStyle = 'actual_feasible' } = payload || {};
      if (!files) throw new Error("Missing 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      // Style-specific MANDATORY instructions
      const styleInstructions = {
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements that can be implemented today. BRANDING PLACEMENT: Display "IA-AGUS.COM" subtly on a digital display screen, control panel, or safety signage in the background.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci-fi concept art. Advanced autonomous robotics, holographic AR interfaces, smart automation systems. Sleek metallic surfaces with blue/cyan accent lighting. Minimalist high-tech design. AI-driven predictive systems visible. BRANDING PLACEMENT: Display "IA-AGUS.COM" as a holographic projection, LED signage, or integrated into advanced control terminal screens.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint/schematic. Clean white background with blue lines (classic blueprint aesthetic). Top-down AND isometric technical views showing precise measurements. Include dimension lines with measurements, equipment specifications labels, workflow arrows, and technical annotations. Grid background. BRANDING PLACEMENT: Include "IA-AGUS.COM" in the title block (bottom-right corner) or as a technical drawing stamp/watermark.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Showcase extreme detail of machinery surfaces, textures, materials. Perfect depth of field. Studio-quality lighting with realistic shadows and highlights. BRANDING PLACEMENT: Display "IA-AGUS.COM" on branded equipment labels, professional signage, or a monitor display.`
      };

      const styleInstruction = styleInstructions[promptStyle as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];

      const systemPrompt = `You are an Elite Manufacturing Layout Optimization Specialist.
      
      OBJECTIVE: Generate a SINGLE, DETAILED image prompt for the IMPROVED layout visualization.
      
      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT. Do NOT create multiple variations, alternatives, or options.
      2. The prompt MUST match the specified visual style EXACTLY.
      3. IDENTIFY the exact machine brand/model from the video (e.g., "Jack F4 sewing machine", "Haas VF-2 CNC mill").
      4. DESCRIBE the NEW improved layout strategy (e.g., "U-shaped cellular layout", "One-piece flow station").
      
      VISUAL STYLE REQUIREMENT:
      Selected Style: ${promptStyle}
      ${styleInstruction}
      
      OUTPUT FORMAT - Respond ONLY with valid JSON:
      {
        "current_method_issues": ["string"],
        "efficiency_loss_percentage": number,
        "layout_strategy": "string",
        "key_changes": ["string"],
        "estimated_time_reduction": "string",
        "image_prompt": "string (ONE detailed prompt following the mandatory style instructions above. Must include: specific machine brand/model + operation type + new layout strategy + all style-specific visual elements + IA-AGUS.COM branding as specified. This prompt will be used directly in image generators like Grok Imagine or Google Whisk.)"
      }
      
      FORBIDDEN:
      - Generating multiple prompt variations (e.g., "Option 1:", "Alternatively:", "Version A/B")
      - Using generic descriptions like "industrial sewing machine" when a brand is visible
      - Ignoring the selected visual style
      - Creating prompts that don't match the style instructions
      
      REMINDER: The image_prompt field MUST contain EXACTLY ONE complete prompt in the ${promptStyle} style.`;

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
        ? `Eres un experto en manufactura e ingeniería industrial. ESTAMOS EN EL AÑO 2026.  
           Analiza el siguiente contexto de operación y responde la pregunta del usuario considerando las tendencias actuales de 2026.
           CONTEXTO: ${analysisContext || "N/A"}. Modo: ${mode || "General"}`
        : `Eres el Help Desk de Manufactura IA Pro de IA.AGUS. ESTAMOS EN EL AÑO 2026. 
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
      const { analysisText, style = 'actual_feasible' } = payload || {};

      const type = action === "generate-video-prompt" ? "VIDEO" : "IMAGE";

      // Style-specific MANDATORY instructions (Matched to improve_method for consistency)
      const styleInstructions = {
        'actual': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements. BRANDING: Display "IA-AGUS.COM" subtly on a digital display screen or control panel.`,
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements. BRANDING: Display "IA-AGUS.COM" subtly on a digital display screen or control panel.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci-fi concept art. Advanced autonomous robotics, holographic AR interfaces, smart automation systems. Sleek metallic surfaces with blue/cyan accent lighting. BRANDING: Display "IA-AGUS.COM" as a holographic projection or LED signage.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint/schematic. Clean white background with blue lines (classic blueprint aesthetic). Top-down AND isometric technical views. Include dimension lines, equipment specifications labels, and workflow arrows. BRANDING: Include "IA-AGUS.COM" in the title block (bottom-right) or as a technical stamp.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Extreme detail of machinery textures. BRANDING: Display "IA-AGUS.COM" on branded equipment labels or professional signage.`
      };

      const styleInstruction = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];
      const modifier = type === "VIDEO" ? "Cinematic video shot, steady camera movement, 4k, 60fps." : "High-resolution static image.";

      const systemPrompt = `You are an Expert Visual Prompt Engineer for Manufacturing.
      OBJECTIVE: Convert the provided analysis into a SINGLE, PRECISE ${type} PROMPT for a generative AI model.
      
      INPUT CONTEXT: 
      "${analysisText?.substring(0, 1000)}..." (Focus on key machinery and layout)

      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT BLOCK. No intro, no "Here is the prompt", no quotes.
      2. STRICTLY FOLLOW the selected visual style.
      3. INTEGRATE "IA-AGUS.COM" branding as specified.
      
      SELECTED STYLE: ${style}
      INSTRUCTIONS: ${styleInstruction}
      
      OUTPUT FORMAT:
      Return ONLY the prompt string. It should start with the visual style keyword (e.g., "Technical blueprint of...").
      `;

      const result = await defaultModel.generateContent(systemPrompt);
      let promptText = result.response.text().trim();

      // Cleanup cleanup
      promptText = promptText.replace(/^"|"$/g, '').replace(/^Here is.*:/i, '').trim();

      return new Response(JSON.stringify({ result: promptText }), {
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
