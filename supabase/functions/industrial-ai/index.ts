import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "npm:@supabase/supabase-js";

// Supabase client for knowledge base lookups
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

/** Fetch company knowledge from the DB and format it for AI */
async function getCompanyKnowledge(company: string): Promise<string> {
  if (!company) return '';
  try {
    const { data, error } = await supabaseClient
      .from('company_knowledge_base')
      .select('category, title, content, metadata')
      .eq('company', company)
      .order('category')
      .order('title');
    if (error || !data || data.length === 0) return '';
    // Group by category
    const grouped: Record<string, typeof data> = {};
    for (const entry of data) {
      if (!grouped[entry.category]) grouped[entry.category] = [];
      grouped[entry.category].push(entry);
    }
    let output = `=== BASE DE CONOCIMIENTO: ${company} ===\n\n`;
    for (const [category, items] of Object.entries(grouped)) {
      output += `--- ${category.toUpperCase().replace(/_/g, ' ')} ---\n`;
      for (const item of items) {
        output += `• ${item.title}: ${item.content}`;
        if (item.metadata?.ficha_tecnica) output += ` | Ficha técnica: ${item.metadata.ficha_tecnica}`;
        output += '\n';
      }
      output += '\n';
    }
    output += `=== FIN BASE DE CONOCIMIENTO ${company} ===`;
    return output;
  } catch (err) {
    console.error('Error fetching knowledge:', err);
    return '';
  }
}

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
      const { files, mode, lang, videoMetadata } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing or invalid 'files' in payload");

      const parts = [];

      // OPTION 6: Native Video API (Highest Precision)
      if (videoMetadata && payload.videoData) {
        console.log("Using Native Video API for analysis...");
        parts.push({
          inlineData: {
            mimeType: payload.videoData.mimeType,
            data: payload.videoData.base64
          }
        });
      } else {
        // Fallback: Frame Sequence (V1)
        console.log("Using Frame Sequence fallback...");
        parts.push(...files.map((f: any) => ({
          inlineData: { mimeType: f.mimeType, data: f.base64 }
        })));
      }

      const systemPrompt = `You are a DETERMINISTIC TIME STUDY ENGINEER & MOTION ANALYST (MODAPTS/MTM Certified).
      
      CRITICAL OBJECTIVE:
      You will receive a SEQUENCE OF FRAMES representing an industrial operation. Your job is to MEASURE TIME PRECISELY based *only* on the provided timestamps/frames and classify motions using THERBLIGS.

      PHASE 0 - FRAME-BASED TIMING (ABSOLUTE TRUTH):
      1. You are analyzing DISCRETE FRAMES, not a continuous video.
      2. Use the "Start Time" and "End Time" of the detected motions based strictly on the frame sequence.
      3. INTERPOLATE time between frames if necessary, but anchor your analysis to the visible evidence.
      
      PHASE 1 - THERBLIG ANALYSIS & MICRO-MOTIONS:
      You must break down the operation into basic motion elements (THERBLIGS):
      - RE (Reach / Alcanzar): Moving hand to an object.
      - G (Grasp / Tomar): Closing fingers around an object.
      - M (Move / Mover): Moving object to new location.
      - P (Position / Posicionar): Orienting object for use.
      - A (Assemble / Ensamblar): Joining parts (e.g., Sewing, Screwing).
      - RL (Release / Soltar): Relinquishing control.
      - HI (Inspect / Inspeccionar): Quality check.
      
      PHASE 2 - DETECT INDUSTRY SECTOR:
      - Textile/Garment: Sewing machines, fabric, thread (Focus on needle time vs handling time).
      - Metalworking/CNC: Metal parts, chips, machine tools.
      - Assembly: Components, fasteners, stations.
      
      PHASE 3 - ADVANCED INDUSTRIAL ANALYSIS:
      1. MUDA DISCOVERY (8 WASTES): Detect Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, and Unused Talent.
      2. 5S VISUAL AUDIT: Evaluate Sort, Set in Order, Shine, Standardize, Sustain.
      3. SAFETY COMPLIANCE: Audit PPE (glasses, gloves), hazards, and ergonomics.
      4. WORKSTATION LAYOUT: Identify positions of bins, dispose areas, and machine orientation.
      
      PHASE 4 - TEXTILE/SEWING PROTOCOL (IF APPLICABLE):
      - Identify the exact sewing burst (Machine Cycle).
      - Identify handling time (Manual Cycle).
      - Recommendations: Automated stackers, folders, cutters.
      
      STRICT OUTPUT (JSON):
      {
        "operation_name": "string (Auto-detected)",
        "technical_specs": { "machine": "string", "material": "string", "rpm_speed": "string" },
        "cycle_analysis": [
          { 
            "element": "string (Description using standard engineering terms)", 
            "time_seconds": number (Precise duration),
            "start_time": "string (MM:SS)",
            "end_time": "string (MM:SS)",
            "value_added": boolean, 
            "therblig": "string (Code: RE, G, M, P, A, RL, etc.)" 
          }
        ],
        "time_calculation": {
          "observed_time": number (SUM of elements),
          "normal_time": number,
          "rating_factor": number (e.g., 0.90 - 1.10),
          "allowances_pfd": number (e.g., 0.15),
          "standard_time": number,
          "units_per_hour": number
        },
        "quality_audit": { ... },
        "ergo_vitals": { ... },
        "waste_analysis": { ... },
        "lean_metrics": { ... },
        "safety_audit": { ... },
        "improvements": [ ... ],
        "summary_text": "string (Briefly describe the detected cycle and key findings)",
        "image_prompt": "string"
      }
      
      PHASE 5 - CRITICAL VALIDATION (SANITY CHECK):
      1. **SECONDS ONLY**: All times must be in SECONDS.
      2. **REALITY CHECK**: A sewing cycle is usually 30-90 seconds. If you calculate >5 minutes for a single shirt operation, YOU ARE WRONG.
      3. **THERBLIG ACCURACY**: Ensure 'Reach' and 'Move' are distinguished from 'Assemble'.
      4. **MANDATORY QUALITATIVE DATA**: You MUST estimate and fill 'quality_audit', 'ergo_vitals', 'waste_analysis', 'lean_metrics', 'safety_audit', and 'improvements'. **DO NOT RETURN 0, NULL, "None", "N/A", or empty strings.**
      5. **PROACTIVE CONTENT**: If you don't see immediate defects or waste, you MUST suggest *preventative* measures (e.g., "Monitor needle heat", "Check thread tension for 100% seam integrity"). 
      6. **ANTI-HALLUCINATION**: 
         - DO NOT list "Trim Threads" unless you CLEARLY see scissors/snips.
         - "Dispose" or "Get Part" should be FAST (< 3.0s). If you calculate 7s for "Dispose", you are likely merging "Wait" time. Split it.
         - DO NOT separate "Remove fabric from machine" and "Dispose fabric" into two elements if they happen in one continuous motion. Merge them into "Dispose fabric".
         - "Reach" is usually < 2.0s.
      7. **ELITE IMPROVEMENTS**: Every improvement MUST have a specific 'issue', 'recommendation', 'methodology' (Process, Optimization, Ergonomics, or Quality), and 'impact'.
      8. **CYCLE ISOLATION (CRITICAL)**: If the video shows multiple repetitive cycles (e.g., sewing 5 pockets), you MUST only report the breakdown for ONE (1) representative cycle (the first or best one). DO NOT mix multiple cycles in one analysis.
      9. **ARITHMETIC GROUNDING**: Every 'time_seconds' MUST be exactly 'end_time - start_time'. DO NOT invent or estimate durations that don't match the timestamps.
      10. **MACHINE CYCLE DEFINITION**: "Machine Cycle" (A) refers ONLY to the time the machine is actively working on the material. 
      11. **MANUAL REPOSITIONING**: Any manual adjustments, shifts, or fabric handling between sewing bursts MUST be a separate element (e.g., "Reposition Fabric").
      12. **SPEED LIMITS (HANDLING)**: Simple manual motions MUST be FAST.
          - Reach (RE) / Grasp (G) / Dispose (RL): 0.4s - 0.9s.
          - Position (P): 0.6s - 1.8s.
          - If a manual step takes >2s, it's likely a "Process Delay" or "Search" (hallucination). Split it.
      
      Language: ${lang || 'es'}. ANALYZE THE FRAMES DETAILEDLY.
      
      STRICT OUTPUT(JSON):

      {
        "operation_name": "string (Auto-detected)",
          "technical_specs": { "machine": "string", "material": "string", "rpm_speed": "string" },
        "cycle_analysis": [
          {
            "element": "string",
            "time_seconds": number(EXACT SECONDS),
            "value_added": boolean,
            "therblig": "string"
          }
        ],
          "time_calculation": {
          "observed_time": number(SUM of elements),
            "normal_time": number,
              "rating_factor": number,
                "allowances_pfd": number,
                  "standard_time": number,
                    "units_per_hour": number
        },
        "quality_audit": {
          "risk_level": "Medium",
            "potential_defects": ["Uneven stitching", "Loose threads"],
              "iso_compliance": "ISO-9001:2015 Clause 8.5.1",
                "poka_yoke_opportunity": "Edge guide for straight seams"
        },
        "ergo_vitals": {
          "overall_risk_score": 6,
            "posture_score": 5,
              "repetition_score": 8,
                "force_score": 4,
                  "critical_body_part": "Wrist/Neck",
                    "recommendation": "Adjust chair height and use wrist support."
        },
        "waste_analysis": {
          "waste_type": "Fabric Scraps",
            "environmental_impact": "Medium",
              "disposal_recommendation": "Recycle as textile fill",
                "sustainability_score": 7
        },
        "lean_metrics": {
          "muda_scores": { "transport": 2, "inventory": 1, "motion": 8, "waiting": 3, "overproduction": 1, "overprocessing": 4, "defects": 2, "skills": 1 },
          "five_s_audit": { "seiri": 3, "seiton": 4, "seiso": 3, "seiketsu": 4, "shitsuke": 3, "overall": 3.4 },
          "kaizen_blitz_goals": ["Reduce thread trimming time", "Optimize fabric layout"],
            "takt_time_alignment": "Aligned with 45s cycle"
        },
        "safety_audit": {
          "ppe_detected": ["Gloves", "Eye Protection"],
            "ppe_missing": ["Earplugs"],
              "hazard_zones_violations": 0,
                "safety_score": 95
        },
        "improvements": [
          {
            "issue": "Excessive manual trimming",
            "recommendation": "Auto-trimming sewing machine",
            "methodology": "Automation",
            "impact": "Reduce cycle by 4s",
            "roi_potential": "High"
          }
        ],
          "centralization_strategy": {
          "current_layout_type": "Cellular",
            "proposed_efficiency_gain": "15%"
        },
        "line_balance_analysis": {
          "bottleneck_station": "Sewing",
            "balance_efficiency": "85%"
        },
        "tooling_upgrades": ["Automatic thread cutter"],
          "summary_text": "string (Briefly describe the detected cycle and key findings)",
            "image_prompt": "string"
      }

  PHASE 6 - CRITICAL VALIDATION(SANITY CHECK):
      1. ** SECONDS ONLY **: All times must be in SECONDS.If the video is 20s, the observed time MUST be ~20s.NOT 20 minutes.
      2. ** REALITY CHECK **: A sewing cycle is usually 30 - 90 seconds.If you calculate > 5 minutes for a single shirt operation, YOU ARE WRONG.Convert units.
      3. ** SAM BENCHMARKS **: Compare against standard times(Straight seam: ~0.30min).If > 40 % deviation, re - calculate.

        Language: ${lang || 'es'}. ANALYZE THE RAW VIDEO STREAM DIRECTLY.`;

      // Build video metadata context for temporal accuracy
      let metadataContext = '';
      if (videoMetadata) {
        metadataContext = `VIDEO METADATA: Total Duration = ${videoMetadata.duration} s. 
        If you are analyzing a RAW VIDEO FILE: The model sees the whole video.Map your element start / end times precisely to the video timeline.
        If you are analyzing FRAMES: Use these timestamps[${videoMetadata.timestamps?.join(', ')}]s.
        The total cycle time CANNOT exceed ${videoMetadata.duration} s.`;
      }

      const userPrompt = `Analyze this operation of ${mode || 'manufacturing'}. ${metadataContext} Return ONLY the JSON.`;

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
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic.Well - lit modern factory floor with actual feasible equipment.Natural lighting, clean workspace.Focus on real - world improvements that can be implemented today.LAYOUT: Show a clear perspective of the station including bins(contenedores), disposal areas(area de dispose), and operator workspace.BRANDING PLACEMENT: Display "IA-AGUS.COM" subtly on a digital display screen, control panel, or safety signage in the background.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci - fi concept art.Advanced autonomous robotics, holographic AR interfaces, smart automation systems.Sleek metallic surfaces with blue / cyan accent lighting.Minimalist high - tech design.AI - driven predictive systems visible.LAYOUT: Advanced spatial arrangement with optimized material flow visible.BRANDING PLACEMENT: Display "IA-AGUS.COM" as a holographic projection, LED signage, or integrated into advanced control terminal screens.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint / schematic.Clean white background with blue lines(classic blueprint aesthetic).PRIMARY PERSPECTIVE: BIRD'S-EYE VIEW (VISTA DESDE ARRIBA / SUPERIOR) for layout optimization. Include top-down AND isometric technical views showing precise measurements. DRAW: Position of bins (contenedores), disposal zones (dispose), operator footprint, material flow arrows, and technical annotations. Grid background. BRANDING PLACEMENT: Include "IA-AGUS.COM" in the title block (bottom-right corner) or as a technical drawing stamp/watermark.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Showcase extreme detail of machinery surfaces, textures, materials. Perfect depth of field. STUDIO LIGHTING: Clear visibility of workstation layout, containers, and operator positioning. BRANDING PLACEMENT: Display "IA-AGUS.COM" on branded equipment labels, professional signage, or a monitor display.`
      };

      const styleInstruction = styleInstructions[promptStyle as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];

      const systemPrompt = `You are an Elite Manufacturing Layout Optimization Specialist with MASTERCLASS expertise in Lean Textile Engineering.
      
      OBJECTIVE: Generate a SINGLE, DETAILED image prompt for the IMPROVED layout visualization.
      
      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT. Do NOT create multiple variations, alternatives, or options.
      2. The prompt MUST match the specified visual style EXACTLY.
      3. IDENTIFY the exact machine brand/model from the video (e.g., "Jack F4 sewing machine", "Haas VF-2 CNC mill").
      4. DESCRIBE the NEW improved layout strategy (e.g., "U-shaped cellular layout", "One-piece flow station").
      5. LAYOUT ELEMENTS: Explicitly describe the placement of input bins (contenedores), disposal areas (dispose zones), the operator's standing/sitting position, and the directional flow of materials.
      6. PERSPECTIVE: If the style is "blueprint", the perspective MUST be Top-Down (Bird's-eye view). For other styles, ensure the station layout is clearly visible.
      
      MASTERCLASS TEXTILE PROTOCOL (IF SEWING/GARMENT DETECTED):
      When the operation involves sewing or garment manufacturing:
      - ALWAYS suggest an AUTOMATED MACHINE WITH PNEUMATIC STACKER for repetitive small-parts operations (pocket facing, coin pockets, belt loops, fly prep, pocket bags).
      - Show in the image: The automated station with a STACKER OUTPUT TRAY collecting finished parts, ORGANIZED INPUT BINS with cut fabric, and a CLEAR MATERIAL FLOW showing parts moving to assembly lines.
      - Recommend a CENTRALIZED "Preliminary Department" layout where these automated stations feed ALL production lines with pre-made parts.
      - Highlight the transition: Main sewing lines become "PURE ASSEMBLY" lines that only join components.
      - Show STORAGE BINS at the assembly line receiving pre-prepared parts from the central area.
      
      VISUAL STYLE REQUIREMENT:
      Selected Style: ${promptStyle}
      ${styleInstruction}
      
      OUTPUT FORMAT - Respond ONLY with valid JSON:
      {
        "current_method_issues": ["string"],
        "efficiency_loss_percentage": number,
        "layout_strategy": "string",
        "centralization_recommendation": "string (describe if this operation should move to a Centralized Parts Prep department)",
        "automation_suggestion": "string (specific machine with stacker, e.g., IMB MB2002A lockstitch with pneumatic stacker)",
        "key_changes": ["string"],
        "estimated_time_reduction": "string",
        "image_prompt": "string (ONE detailed prompt following the mandatory style instructions above. Must include: specific machine brand/model + stacker output tray + input bins + operator position + material flow arrows + IA-AGUS.COM branding. For textile: show the centralized prep station with automated machine and stacker feeding bins that go to assembly lines.)"
      }
      
      FORBIDDEN:
      - Generating multiple prompt variations (e.g., "Option 1:", "Alternatively:", "Version A/B")
      - Using generic descriptions like "industrial sewing machine" when a brand is visible
      - Ignoring the selected visual style
      - Creating prompts that don't match the style instructions
      - For textile operations: NOT mentioning stackers or centralization
      
      REMINDER: The image_prompt field MUST contain EXACTLY ONE complete prompt in the ${promptStyle} style.`;

      const userPrompt = `Analyze these frames of a ${mode || 'manufacturing'} operation and propose improvements. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([{ text: systemPrompt }, { text: userPrompt }, ...parts]);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // DYNAMIC COMPANY KNOWLEDGE BASE — fetched from Supabase DB
    // Each company's catalog is stored in company_knowledge_base table
    // ═══════════════════════════════════════════════════════════════

    if (action === "chat-report" || action === "chat-support") {
      console.log(`Processing chat action: ${action}`);
      const { question, history = [], analysisContext, mode, company } = payload || {};

      if (!question) throw new Error("Missing 'question' in payload");

      // Fetch company knowledge dynamically from DB
      const COMPANY_KNOWLEDGE = await getCompanyKnowledge(company || '');
      const hasKnowledge = COMPANY_KNOWLEDGE.length > 0;
      const knowledgeBlock = hasKnowledge ? `\nCONOCIMIENTO DE EMPRESA DISPONIBLE:\n${COMPANY_KNOWLEDGE}` : '';
      const knowledgeInstructions = hasKnowledge ? `
           INSTRUCCIONES DE PRODUCTOS:
           - Cuando el usuario pregunte sobre maquinaria o productos, RECOMIENDA productos específicos de la base de conocimiento.
           - CITA fichas técnicas con datos exactos (capacidad, HP, RPM, peso, dimensiones).
           - PROVEE links a fichas técnicas cuando estén disponibles.
           - Siempre menciona la experiencia y distribución de la empresa.` : '';

      const systemPrompt = action === "chat-report"
        ? `Eres un experto en manufactura e ingeniería industrial${hasKnowledge ? ` y ESPECIALISTA CERTIFICADO en productos de ${company}` : ''}. ESTAMOS EN EL AÑO 2026.
           Analiza el siguiente contexto de operación y responde la pregunta del usuario considerando las tendencias actuales de 2026.
           CONTEXTO: ${analysisContext || "N/A"}. Modo: ${mode || "General"}.
           ${knowledgeBlock}
           ${knowledgeInstructions}`
        : `Eres el Help Desk de Manufactura IA Pro de IA.AGUS${hasKnowledge ? ` y ESPECIALISTA CERTIFICADO en productos de ${company}` : ''}. ESTAMOS EN EL AÑO 2026.
           Eres un consultor experto en optimización de plantas, soporte técnico de la plataforma${hasKnowledge ? `, y asesor especializado en productos de ${company}` : ''}.
           ${knowledgeBlock}
           ${knowledgeInstructions}`;

      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || "" }]
      }));

      const chat = defaultModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Entendido. Soy Especialista Certificado en productos JOPER y experto en manufactura. ¿En qué puedo ayudarte?" }] },
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

    if (action === "classify_segments") {
      console.log("Processing 'classify_segments' action...");
      const { files, mode, lang } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing 'files' in payload");

      // We expect 1 image per segment
      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are an Industrial Engineering Classifier.
      OBJECTIVE: Identify the industrial motion (Therblig) happening in each image provided.
      CONTEXT: These images represent sequential steps in a ${mode || 'manufacturing'} operation.
      
      OUTPUT FORMAT: A JSON array of strings, one for each image.
      Example: ["Reach for fabric", "Position under foot", "Sewing cycle", "Dispose"]
      
      RULES:
      1. Use standard industrial terms (Reach, Grasp, Move, Position, Assemble, Disassemble, Release, Inspect).
      2. Be concise (max 3-4 words per label).
      3. Language: ${lang || 'es'}.
      4. Return ONLY the JSON array.`;

      const userPrompt = `Classify these ${files.length} images in order.`;

      const result = await defaultModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
        ...parts
      ]);

      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      return new Response(JSON.stringify({ result: text }), {
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
