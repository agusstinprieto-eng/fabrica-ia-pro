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

      const systemPrompt = `You are a FRAME-BY-FRAME VIDEO TIME ANALYST (NOT an estimator).
      
      CRITICAL METHOD:
      You will receive a SEQUENCE of video frames. Analyze them AS A TIMELINE, not as isolated images.
      
      PHASE 1 - DETECT INDUSTRY SECTOR:
      - Textile/Garment: Sewing machines, fabric, thread
      - Metalworking/CNC: Metal parts, chips, machine tools
      - Assembly: Components, fasteners, stations
      - Food/Packaging: Food products, packaging
      - General Manufacturing: Other operations
      
      PHASE 2 - FRAME-BY-FRAME MOTION ANALYSIS:
      
      INSTRUCTIONS:
      1. The video frames are provided in SEQUENCE. Assume frames are evenly spaced (e.g., 1 frame per second or per 0.5s).
      2. IDENTIFY MOTION TRANSITIONS: Watch for when one distinct action ends and another begins.
      3. COUNT FRAMES for each element. If an action spans 3 frames, that's ~3 seconds (or proportional to frame rate).
      4. BE DETERMINISTIC: Same video sequence = same frame counts = same times.
      
      EXAMPLE ANALYSIS:
      - Frame 1-2: Operator reaches for fabric → Element: "Reach fabric" → 2 frames → 2.0s
      - Frame 3-5: Positioning fabric under needle → Element: "Position fabric" → 3 frames → 3.0s  
      - Frame 6-10: Machine sewing → Element: "Sewing operation" → 5 frames → 5.0s
      → TOTAL: 10.0s
      
      CRITICAL RULES:
      1. IDENTICAL FRAME SEQUENCE = IDENTICAL OUTPUT. No variance.
      2. Time per element = number of frames it spans × assumed frame interval (default 1.0s per frame).
      3. If you cannot determine frame rate, assume 1 frame = 1 second.
      4. Count ALL frames. Do not skip or hallucinate frames.
      
      STRICT OUTPUT (JSON):
      {
        "operation_name": "string",
        "technical_specs": { 
          "machine": "string (EXACT BRAND if visible)", 
          "material": "string",
          "rpm_speed": "string"
        },
        "cycle_analysis": [
          { 
            "element": "string (Action description)", 
            "time_seconds": number (Frame count × frame interval, exact 2 decimals),
            "frame_start": number (Which frame this element starts),
            "frame_end": number (Which frame this element ends),
            "value_added": boolean, 
            "therblig": "string" 
          }
        ],
        "time_calculation": {
          "observed_time": number (EXACT SUM of all cycle_analysis times),
          "normal_time": number (= observed_time * rating_factor),
          "rating_factor": number (default 1.0),
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
        "summary_text": "string",
        "image_prompt": "string (Photorealistic description of the CURRENT operation for visualization. STRUCTURE: '[Specific Machine Brand & Model if visible] performing [Operation Name] in current layout. [Key details of workspace, lighting, operator position]. Professional industrial photography. IMPORTANT: Integrate text 'IA-AGUS.COM' subtly on a digital display, machine label, or factory wall in the background.)"
      }
      
      CALCULATION VERIFICATION:
      - observed_time = SUM(all cycle_analysis.time_seconds)
      - Each time_seconds = (frame_end - frame_start + 1) × 1.0s
      - normal_time = observed_time × rating_factor
      - standard_time = normal_time × (1 + allowances_pfd)
      
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
