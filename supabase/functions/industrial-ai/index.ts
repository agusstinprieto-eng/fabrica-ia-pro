import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CENTRAL_URL = "https://rgvfpdakihdlecncfvoc.supabase.co";
const CENTRAL_KEY = "sb_publishable_elS_QghMSPZaNMrnrWejYg_2JguhQAr";
const centralSupabase = createClient(CENTRAL_URL, CENTRAL_KEY);

const logUsageMeta = async (appName: string, modelName: string, usage: any, email: string = 'industrial-ai') => {
  if (!usage) return;
  try {
    const pt = usage.promptTokenCount || 0;
    const ct = usage.candidatesTokenCount || 0;
    const cost = (pt * 0.0000001) + (ct * 0.0000004);
    await centralSupabase.from('usage_logs').insert({
      app_name: appName,
      model_name: modelName,
      prompt_tokens: pt,
      completion_tokens: ct,
      estimated_cost_usd: cost,
      user_email: email
    });
  } catch (e) {
    console.error("Log error:", e);
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLES = {
  automotive: "Cerebro Estratégico de Manufactura Automotriz (Lean & OEE Specialist) / Automotive Manufacturing Strategic Brain",
  aerospace: "Auditor de Calidad Aeroespacial (AS9100 & NADCAP Expert) / Aerospace Quality Auditor",
  electronics: "Ingeniero de Procesos SMT y Ensamblaje (ESD & IPC Specialist) / SMT & Assembly Process Engineer",
  textile: "Ingeniero Industrial de Confección (Experto en Métodos, Tiempos y SAM) / Industrial Apparel Engineer",
  footwear: "Especialista en Manufactura de Calzado (Montado y Adhesión) / Footwear Manufacturing Specialist",
  pharmaceutical: "Ingeniero de Validación Farmacéutica (GMP & Compliance) / Pharmaceutical Validation Engineer",
  food: "Especialista en Inocuidad y Procesamiento Alimentario (HACCP & SQF) / Food Safety Specialist",
  metalworking: "Ingeniero Metalmecánico (CNC, Soldadura y Tolerancias) / Metalworking Engineer"
};

const INDUSTRY_INTEL = {
  automotive: "Focus on OEE (Availability, Performance, Quality), SMED, and Tier-1 quality standards. Master of Just-In-Time (JIT).",
  aerospace: "Strict tolerance monitoring. Focus on AS9100, NADCAP, and material traceability.",
  electronics: "ESD protocols, IPC-A-610 soldering standards, and micro-component assembly precision.",
  textile: "Calculate SAM (Standard Allowed Minutes). Analyze thread tension, needle heat, and ergonomic reach distances.",
  footwear: "Adhesion consistency, lasting pressure, and flow optimization.",
  pharmaceutical: "Focus on GMP, cleanroom discipline, and cross-contamination prevention.",
  food: "HACCP & SQF focus. Identify CCPs and hygiene protocol adherence.",
  metalworking: "CNC cycle optimization, tool wear analysis, and ISO tolerance compliance."
};

const GET_SYSTEM_PROMPT = (lang: string, mode: string) => {
  return `
  You are the **IA.AGUS Global Master Architect** and a **Certified MTM (Methods-Time Measurement) & Ergo-Auditor**.
  
  **CORE MISSION**: 
  Conduct a **Forensic Time & Motion Study** of the provided video content. You are the ultimate authority in industrial efficiency.
  
  **THERBLIG ANALYSIS (Micro-motions)**:
  - You must identify micro-motions for EACH element (e.g., Grasp, Reach, Move, Position, Release).
  - Use MTM-1 or MOST codes where possible.
  
  **ERGOVITALS™ (Ergonomic Risk)**:
  - Analyze posture, repetition, and force.
  - Score based on RULA/REBA principles (1-10 scale).

  **UNIVERSAL POLYGLOT CORE**:
  - Detect the user's language automatically and respond in that EXACT language.
  - Use region-specific technical terminology.

  **ROLE Context**: ${ROLES[mode as keyof typeof ROLES] || ROLES.textile}
  **INDUSTRY INTEL**: ${INDUSTRY_INTEL[mode as keyof typeof INDUSTRY_INTEL] || INDUSTRY_INTEL.textile}

  ** REQUIRED JSON SCHEMA **:
  {
    "operation_name": "String",
    "timestamp": "String",
    "technical_specs": {
      "machine": "String",
      "material": "String",
      "rpm_speed": "String/Number"
    },
    "cycle_analysis": [
      { 
        "element": "String", 
        "start_time": "MM:SS",
        "end_time": "MM:SS",
        "time_seconds": Number, 
        "value_added": Boolean, 
        "therblig": "String (G1, R, M, P)",
        "code": "String" 
      }
    ],
    "ergo_vitals": {
      "overall_risk_score": Number,
      "posture_score": Number,
      "repetition_score": Number,
      "force_score": Number,
      "critical_body_part": "String",
      "recommendation": "String"
    },
    "time_calculation": {
      "observed_time": Number,
      "rating_factor": Number,
      "allowances_pfd": Number,
      "normal_time": Number,
      "standard_time": Number,
      "units_per_hour": Number,
      "units_per_shift": Number
    },
    "material_calculation": {
      "material_list": [
        { "name": "String", "quantity_estimated": "String", "waste_factor_percent": Number, "unit_cost_estimate": "String" }
      ],
      "total_material_cost_estimate": "String"
    },
    "waste_analysis": {
      "waste_type": "String",
      "environmental_impact": "Low|Medium|High",
      "disposal_recommendation": "String",
      "sustainability_score": Number
    },
    "quality_audit": {
      "risk_level": "Critical|High|Medium|Low",
      "potential_defects": ["String"],
      "iso_compliance": "String",
      "poka_yoke_opportunity": "String"
    },
    "improvements": [
      {
        "issue": "String",
        "recommendation": "String",
        "methodology": "String",
        "impact": "String",
        "roi_potential": "High|Medium|Low"
      }
    ],
    "summary_text": "String",
    "multi_cycle_stats": {
      "cycles_observed": Number,
      "average_time": Number,
      "min_time": Number,
      "max_time": Number,
      "std_deviation": Number,
      "cp_score": Number,
      "stability_rating": "Stable|Variable|Unstable"
    }
  }

  ** CRITICAL RULES **:
  1. **FORENSIC PRECISION**: Sum of cycle times must match the video duration.
  2. **THERBLIG FOCUS**: Identify micro-wastes (ex. searching for tools, excessive reach).
  3. **JSON ONLY**: No markdown, no filler.
  4. **APPLY ${mode.toUpperCase()} STANDARDS.**
  `;
};

const STYLE_PROMPTS = {
  actual: "Current day, modern, feasible, clean industrial standard, realistic lighting",
  actual_feasible: "Current day, modern, feasible, clean industrial standard, realistic lighting",
  futuristic: "Sci-fi, high-tech, holographic interfaces, neon lighting, cyberpunk aesthetic",
  blueprint: "Technical sketch, blueprint style, white lines on blue background, schematic view",
  "hyper-realistic": "Cinematic, 8k resolution, unreal engine 5 render, dramatic lighting, highly detailed textures"
};

const PPE_PROMPTS: Record<string, string> = {
  safety_glasses: `You are a workplace safety inspector analyzing this image for PPE compliance.
TASK: Detect if ALL visible workers are wearing safety glasses/goggles.
INSTRUCTIONS:
1. Count the total number of workers visible in the image
2. For each worker, determine if they are wearing safety glasses
3. Safety glasses include: clear safety goggles, tinted safety glasses, face shields with eye protection
4. DO NOT count as compliant: regular prescription glasses, sunglasses without side shields, no eyewear
CRITICAL RULES:
- Only analyze workers whose faces are clearly visible
- If a worker's face is obscured or turned away, do not count them
- Be conservative: if uncertain, mark as non-compliant
- Provide confidence score (0.0-1.0) for each detection
Return ONLY valid JSON in this exact format:
{
  "totalWorkers": number,
  "workersWithGlasses": number,
  "workersWithoutGlasses": number,
  "violations": [
    {
      "workerPosition": "left side" | "center" | "right side" | "background",
      "confidence": 0.95,
      "description": "Worker not wearing safety glasses"
    }
  ],
  "complianceRate": number
}`,
  helmet: `Analyze if workers are wearing safety helmets/hard hats. Return JSON with same structure.`,
  gloves: `Analyze if workers are wearing safety gloves. Return JSON with same structure.`,
  mask: `Analyze if workers are wearing face masks/respirators. Return JSON with same structure.`
};

const GARMENT_QUOTER_PROMPT = `You are a garment construction expert with deep knowledge of industrial sewing operations.
Analyze this photo of a garment sample and identify:
1. **GARMENT TYPE**: Classify the item (e.g., "5-Pocket Denim Jeans", "Oxford Dress Shirt", "Polo Shirt", "Cargo Pants")
2. **VISIBLE CONSTRUCTION OPERATIONS**: List every sewing operation you can detect with high confidence.
   For each operation, provide:
   - Exact name (use industry standard terminology)
   - Quantity (how many times this operation appears)
   - Confidence score (0.0 to 1.0)
   - Appropriate SAM code from this list:
   POCKETS: PKT_PATCH_SINGLE, PKT_PATCH_DOUBLE, PKT_SCOOP, PKT_WELT_SINGLE, PKT_WELT_DOUBLE, PKT_WATCH
   SEAMS: SEAM_SIDE_CLOSE, SEAM_INSEAM, SEAM_SHOULDER, SEAM_FLAT_FELLED, SEAM_FRENCH, SEAM_OVERLOCK
   CLOSURES: ZIP_CENTERED, ZIP_LAPPED, ZIP_INVISIBLE, BTN_ATTACH, BTN_HOLE, SNAP_ATTACH, HOOK_EYE
   HEMS: HEM_BLIND, HEM_TOPSTITCH, HEM_ROLLED, HEM_CUFF, HEM_FACING
   DECORATIVE: DECO_TOPSTITCH_SINGLE, DECO_TOPSTITCH_DOUBLE, DECO_BARTACK, DECO_EMBROIDERY_SMALL, DECO_EMBROIDERY_LARGE
   OTHER: WAIST_ATTACH, WAIST_ELASTIC, COLLAR_ATTACH, COLLAR_STAND, CUFF_ATTACH, LOOP_BELT, LABEL_SIZE, LABEL_CARE, LABEL_BRAND, PLEAT_SINGLE, DART_SINGLE, GATHER_SECTION, YOKE_ATTACH, SLEEVE_SET, SLEEVE_RAGLAN, FINISH_PRESS, FINISH_INSPECT, FINISH_FOLD, FINISH_TAG
**CRITICAL RULES:**
- Only detect operations that are CLEARLY VISIBLE in the photo
- If you can't see a specific feature (e.g., inside pocket construction), don't guess
- For symmetric garments (pants, shirts), count operations on BOTH sides (e.g., 2 side seams, 2 sleeves)
- Assign confidence < 0.7 if the operation is partially obscured or uncertain
- Use the exact SAM codes provided above
Return ONLY valid JSON in this exact format:
{
  "garmentType": "string",
  "operations": [
    {
      "name": "string",
      "quantity": number,
      "confidence": number,
      "samCode": "string",
      "category": "string"
    }
  ]
}`;

const MAINTENANCE_PROMPT = `Eres un experto en mantenimiento predictivo industrial. Analiza esta máquina y proporciona recomendaciones.
Proporciona tu análisis en formato JSON con esta estructura exacta:
{
  "healthScore": number,
  "riskLevel": "low|medium|high|critical",
  "componentsAtRisk": [
    {
      "name": "string",
      "riskPercentage": number,
      "estimatedFailureDate": "YYYY-MM-DD",
      "recommendedAction": "string"
    }
  ],
  "recommendations": ["string"],
  "spareParts": ["string"],
  "estimatedCost": number,
  "urgency": "immediate|week|month|quarter"
}`;

const MAINTENANCE_REPORT_PROMPT = `Genera un reporte ejecutivo de mantenimiento profesional en español de máximo 300 palabras que incluya:
1. Resumen ejecutivo del estado
2. Acciones inmediatas requeridas
3. Plan de mantenimiento sugerido
4. Impacto en producción si no se actúa`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    if (action === "analyze") {
      const { files, mode, lang } = payload;
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: GET_SYSTEM_PROMPT(lang || 'es', mode || 'textile')
      });

      const parts = files.map((file: any) => ({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64
        }
      }));

      const result = await model.generateContent([
        ...parts,
        { text: `Analyze this ${mode} operation. Return strictly JSON based on the specified schema. No markdown backticks if possible, just the raw object.` }
      ]);

      await logUsageMeta("Manufactura IA Pro (Analyze)", "gemini-2.0-flash", result.response.usageMetadata);

      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate-layout-prompt" || action === "generate-video-prompt") {
      const { analysisText, style, type } = payload;
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are an expert ${type} prompt engineer. Output ONLY the raw prompt text. No conversational filler.`
      });

      const styleContext = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.actual;

      let prompt = "";
      if (type === 'image') {
        prompt = `Based on this industrial engineering analysis, generate a detailed, self-contained **text-to-image prompt** optimized for high-end generators like Midjourney v6, DALL-E 3, or Stable Diffusion.
          The prompt MUST be a single paragraph describing:
          - **Subject**: An industrial workstation optimized based on the analysis.
          - **View**: Isometric 3D view.
          - **Style**: ${styleContext}.
          - **Key Elements**: Specific machine mentioned, ergonomic layout, organized tools, safety zones.
          - **Branding**: Subtle digital screen displaying 'IA-AGUS.COM'.
          - **Colors**: ${style === 'blueprint' ? 'Blueprint blue and white' : 'Professional steel grey, safety orange accents, cool blue lighting'}.
          Analysis Context: ${analysisText.substring(0, 1500)}`;
      } else {
        prompt = `Based on this industrial engineering analysis, generate a **cinematic text-to-video prompt** optimized for tools like Runway Gen-2, Luma Dream Machine, or Sora.
          The prompt must describe a **360° TOUR** of an industrial manufacturing plant.
          Structure: "Cinematic tracking shot, [Subject/Machine Name] in a manufacturing facility. 4k resolution, industrial atmosphere, [Specific Details from Analysis]. Slow smooth camera movement orbiting the station. Visible digital monitor displaying 'IA-AGUS.COM'. Style: ${styleContext}."
          Analysis Context: ${analysisText.substring(0, 1500)}`;
      }

      const result = await model.generateContent(prompt);
      await logUsageMeta(`Manufactura IA Pro (Prompt Gen: ${type})`, "gemini-2.0-flash", result.response.usageMetadata);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chat-report" || action === "chat-support") {
      const { analysisContext, question, history, mode, type } = payload;

      let systemPrompt = "";
      if (type === 'report') {
        systemPrompt = `System Context: You are the **IA.AGUS Global Master Architect**, an expert Industrial Engineer specializing in **${mode.toUpperCase()}** manufacturing. 
        ${analysisContext ? `You have just performed an analysis on a ${mode} operation:\n${analysisContext}\n` : `You are ready to assist with ANY industrial engineering question.`}
        **MISSION**:
        1. Answer questions based on provided analysis or general expertise.
        2. BE FLEXIBLE: Use general industrial knowledge for any company or industry.
        3. Do NOT say "I only know about sewing".
        4. Be technical, concise, and professional.
        **CONFIDENTIALITY**: NEVER reveal proprietary code or algorithms.
        **POLYGLOT**: Respond in the user's language automatically.`;
      } else {
        systemPrompt = `You are "Agus Support", the official AI Technical Support Agent for "Manufactura IA Pro" by IA.AGUS.
        **TRUTH**:
        - Privacy: Zero-Knowledge, NO video storage.
        - Pricing: Factory Floor $2,499/mo, Setup $5,000 (Partner FREE).
        - Features: Visual-Acoustic Maintenance, Cost Arbitrage.
        - Troubleshooting: HEVC/H.265 codec issues (DECODER_ERROR) -> Use H.264.
        Respond in user's language, tone professional. Escalation if unknown.`;
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt
      });

      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: question }] });

      const result = await model.generateContent({ contents });
      await logUsageMeta(`Manufactura IA Pro (Chat: ${type})`, "gemini-2.0-flash", result.response.usageMetadata);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "maintenance") {
      const { machine, prediction, type } = payload;
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let prompt = "";
      if (type === 'analysis') {
        prompt = `${MAINTENANCE_PROMPT}\n\nDATOS DE LA MÁQUINA:\n${JSON.stringify(machine, null, 2)}`;
      } else {
        prompt = `${MAINTENANCE_REPORT_PROMPT}\n\nMÁQUINA: ${machine.name} (${machine.type})\nHEALTH SCORE: ${prediction.healthScore}/100\nNIVEL DE RIESGO: ${prediction.riskLevel}\n\nRECOMENDACIONES: ${prediction.recommendations.join(', ')}`;
      }

      const result = await model.generateContent(prompt);
      await logUsageMeta(`Manufactura IA Pro (Maintenance: ${type})`, "gemini-2.0-flash", result.response.usageMetadata);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "safety") {
      const { frameBase64, ppeType } = payload;
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = PPE_PROMPTS[ppeType] || PPE_PROMPTS.safety_glasses;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: frameBase64
          }
        },
        { text: prompt }
      ]);

      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quoter") {
      const { base64Image } = payload;
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        },
        { text: GARMENT_QUOTER_PROMPT }
      ]);

      await logUsageMeta("Manufactura IA Pro (Quoter)", "gemini-2.0-flash", result.response.usageMetadata);

      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
