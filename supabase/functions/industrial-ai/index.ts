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
      5. WORKSTATION LAYOUT ANALYSIS: Identify the current position of the operator, orientation of machines, location of input bins (contenedores), and output/scrap areas (dispose).
      
      PHASE 3 - MASTERCLASS TEXTILE PROTOCOL (APPLY IF TEXTILE/GARMENT DETECTED):
      If the sector is Textile/Garment, apply this ADVANCED strategy layer:
      1. AUTOMATION CANDIDATE DETECTION: Identify if the operation is a "Small Parts" candidate:
         - Pocket facing attach, coin pocket, belt loops, fly preparation, pocket bags, waistband prep, label attach.
         - If YES: Flag as "CENTRALIZATION CANDIDATE" and suggest an automated lockstitch machine WITH STACKER (e.g., IMB MB2002A or equivalent).
      2. CENTRALIZED PARTS PREP (MINI-FACTORY): Recommend moving repetitive small-parts operations OUT of the main sewing lines into a centralized "Preliminary Department" that feeds ALL lines with pre-made parts stored in bins.
      3. PURE ASSEMBLY TRANSITION: Suggest converting the main sewing lines from "fabrication + assembly" into "PURE ASSEMBLY" lines that only join pre-prepared components, increasing throughput.
      4. FLEET OPTIMIZATION: Calculate that centralizing reduces machine count (e.g., 1 central machine with 2 shifts replaces 2+ machines across lines). Highlight: Higher utilization (90%+), reduced footprint, single maintenance hub, elite operator training.
      5. STACKER/DISPOSE LAYOUT: For the image_prompt, ALWAYS include a pneumatic stacker output tray, organized input bins, and clear material flow arrows showing parts moving FROM the central prep area TO the assembly lines.
      
      PHASE 4 - YAMAZUMI LINE BALANCE & BOTTLENECK RESOLUTION (APPLY IF TEXTILE/GARMENT DETECTED):
      When analyzing sewing/garment operations, apply Yamazumi chart logic:
      1. BOTTLENECK DETECTION: Identify if the observed operation has a cycle time significantly above Takt Time. Flag as "BOTTLENECK" if the operator appears overloaded (constant motion, no idle time, visible rushing).
      2. WORKLOAD RE-BALANCE (TASK SHIFTING): If a bottleneck is detected, suggest SPLITTING the operation:
         - Identify sub-tasks within the cycle (e.g., "Join + Fold Mouths" can become "Join Only" + move "Fold + Tack" to downstream stations).
         - Propose moving specific manual sub-tasks to upstream or downstream operators who have available capacity.
         - Example: "Move the mouth-close (tack) portion from the Waistband Join to dedicated Top/Bottom Mouth Close stations."
      3. MULTI-OPERATOR ANALYSIS: If multiple operators perform the same process, note cycle time variance. Large variance = method inconsistency, recommend standardized work instructions.
      4. TAKT TIME ALIGNMENT: Always compare observed cycle time against estimated Takt Time and flag operations that exceed it.
      
      PHASE 5 - NVA MOTION DETECTION & TOOLING UPGRADES (ALL INDUSTRIES):
      Analyze every manual motion for Non-Value-Added (NVA) waste:
      1. MANUAL TRIMMING DETECTION: If the operator uses hand SCISSORS to trim thread, tape, or material:
         - Flag as HIGH NVA (~0.10-0.15 min per piece wasted).
         - Suggest: PNEUMATIC CHAIN CUTTER (e.g., KCR-80) or integrated undertrimmer.
      2. TOOL REACH DETECTION: If tools (scissors, gauges) rest on the table forcing the operator to reach:
         - Flag as NVA MOTION (reach distance).
         - Suggest: SPRING-LOADED RETRACTOR (balancer) to suspend tools directly over the work area, reducing reach from ~45cm to ~5cm.
      3. WASTE ACCUMULATION: If trimmed scraps accumulate near the needle area or workspace:
         - Suggest: SUCTION/VACUUM WASTE REMOVAL system (venturi-style) to immediately clear scraps.
      4. MANUAL HANDLING/FLIPPING: If the operator manually flips, folds, or repositions the garment:
         - Flag as NVA MOTION with high ergonomic strain.
         - Suggest: FOLDING JIG or GUIDE installed on the machine to standardize the fold and reduce handling time.
      5. TOOLING UPGRADE PRIORITY: Classify suggestions as:
         - IMMEDIATE (low-cost): Spring retractors, magnetic tool holders, folding jigs.
         - SHORT-TERM (medium-cost): Pneumatic cutters, auto-trimmers, suction systems.
         - STRATEGIC (high-cost): Full machine upgrade with integrated automation.
      
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
        "centralization_strategy": {
          "is_centralization_candidate": boolean,
          "operation_type": "string (e.g., pocket_facing, belt_loops, fly_prep)",
          "recommended_machine": "string (e.g., IMB MB2002A with stacker)",
          "current_lines_affected": number,
          "machines_saved_by_centralizing": number,
          "shift_strategy": "string (e.g., 2 shifts to double output)"
        },
        "line_balance_analysis": {
          "is_bottleneck": boolean,
          "observed_cycle_vs_takt": "string (e.g., 1.85 min observed vs 1.20 min takt = 54% over)",
          "task_shift_proposal": {
            "current_task_load": "string (e.g., Join + Fold Mouths)",
            "proposed_task_load": "string (e.g., Join Only - open ends)",
            "tasks_shifted_to": "string (e.g., Top/Bottom Mouth Close stations absorb folding)",
            "estimated_cycle_reduction": "string"
          },
          "method_variance_flag": "string (e.g., High variance between operators = standardize work instructions)"
        },
        "tooling_upgrades": [
          {
            "priority": "IMMEDIATE | SHORT-TERM | STRATEGIC",
            "current_problem": "string (e.g., Manual scissors trimming adds 0.12 min/piece)",
            "solution": "string (e.g., KCR-80 Pneumatic Cutter)",
            "nva_time_saved": "string (e.g., 0.12 min/piece)",
            "ergonomic_benefit": "string"
          }
        ],
        "summary_text": "string",
        "image_prompt": "string"
      }
      
      PHASE 6 - SAM VALIDATION & UNIT ENFORCEMENT (CRITICAL):
      1. UNIT LOCK: Always calculate cycle_analysis times in SECONDS first.
      2. CONVERSION: standard_time must be (Total Seconds / 60). Double check this math.
      3. SCALE CHECK: If an operation is "Sewing pocket" and you return 31 minutes, you are WRONG. It should be ~0.50 min (30 seconds).
      4. SAM BENCHMARKS:
         - Straight seam (costura recta): 0.15-0.50 min
         - Overlock edge finish: 0.15-0.50 min
         - Flat-felled seam: 0.60-1.20 min
         - Topstitch: 0.25-0.60 min
         - Patch pocket attach: 0.45-1.20 min
         - Welt pocket: 1.00-2.50 min
         - Fly zipper: 1.20-2.30 min
         - Waistband attach: 0.80-1.50 min
         - Collar attach: 1.00-2.20 min
         - Set sleeve: 0.70-1.30 min
      If your result deviates >40% from the relevant benchmark, RE-EXAMINE the video
      and add a field "sam_validation_note" explaining why (e.g., "Extremely high difficulty fabric", "Machine malfunction detected").
      
      Language: ${lang || 'es'}. ANALYZE RAW VIDEO/SEQUENCE DETERMINISTICALLY.`;

      // Build video metadata context for temporal accuracy
      let metadataContext = '';
      if (videoMetadata) {
        metadataContext = `VIDEO METADATA: Total Duration=${videoMetadata.duration}s. 
        If you are analyzing a RAW VIDEO FILE: The model sees the whole video. Map your element start/end times precisely to the video timeline.
        If you are analyzing FRAMES: Use these timestamps [${videoMetadata.timestamps?.join(', ')}]s.
        The total cycle time CANNOT exceed ${videoMetadata.duration}s.`;
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
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements that can be implemented today. LAYOUT: Show a clear perspective of the station including bins (contenedores), disposal areas (area de dispose), and operator workspace. BRANDING PLACEMENT: Display "IA-AGUS.COM" subtly on a digital display screen, control panel, or safety signage in the background.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci-fi concept art. Advanced autonomous robotics, holographic AR interfaces, smart automation systems. Sleek metallic surfaces with blue/cyan accent lighting. Minimalist high-tech design. AI-driven predictive systems visible. LAYOUT: Advanced spatial arrangement with optimized material flow visible. BRANDING PLACEMENT: Display "IA-AGUS.COM" as a holographic projection, LED signage, or integrated into advanced control terminal screens.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint/schematic. Clean white background with blue lines (classic blueprint aesthetic). PRIMARY PERSPECTIVE: BIRD'S-EYE VIEW (VISTA DESDE ARRIBA / SUPERIOR) for layout optimization. Include top-down AND isometric technical views showing precise measurements. DRAW: Position of bins (contenedores), disposal zones (dispose), operator footprint, material flow arrows, and technical annotations. Grid background. BRANDING PLACEMENT: Include "IA-AGUS.COM" in the title block (bottom-right corner) or as a technical drawing stamp/watermark.`,

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
