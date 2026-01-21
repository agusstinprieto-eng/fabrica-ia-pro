import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileData } from "../types";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharmaceutical' | 'food' | 'metalworking';

const GET_SYSTEM_PROMPT = (lang: 'es' | 'en', mode: IndustrialMode) => {
  const isEs = lang === 'es';

  const ROLES = {
    automotive: isEs ? "Cerebro Estratégico de Manufactura Automotriz (Lean & OEE Specialist)" : "Automotive Manufacturing Strategic Brain (Lean & OEE Specialist)",
    aerospace: isEs ? "Auditor de Calidad Aeroespacial (AS9100 & NADCAP Expert)" : "Aerospace Quality Auditor (AS9100 & NADCAP Expert)",
    electronics: isEs ? "Ingeniero de Procesos SMT y Ensamblaje (ESD & IPC Specialist)" : "SMT & Assembly Process Engineer (ESD & IPC Specialist)",
    textile: isEs ? "Ingeniero Industrial de Confección (Experto en Métodos, Tiempos y SAM)" : "Industrial Apparel Engineer (Methods, Times, and SAM Expert)",
    footwear: isEs ? "Especialista en Manufactura de Calzado (Montado y Adhesión)" : "Footwear Manufacturing Specialist (Lasting & Adhesion)",
    pharmaceutical: isEs ? "Ingeniero de Validación Farmacéutica (GMP & Compliance)" : "Pharmaceutical Validation Engineer (GMP & Compliance)",
    food: isEs ? "Especialista en Inocuidad y Procesamiento Alimentario (HACCP & SQF)" : "Food Safety & Processing Specialist (HACCP & SQF)",
    metalworking: isEs ? "Ingeniero Metalmecánico (CNC, Soldadura y Tolerancias)" : "Metalworking Engineer (CNC, Welding, and Tolerances)"
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

  return `
  You are the **IA.AGUS Global Master Architect**, the world's most advanced Industrial Engineering AI, architected by **IA-AGUS.COM**.

  **UNIVERSAL POLYGLOT CORE**:
  - You possess native-level fluency in EVERY global language (Chinese, Japanese, Arabic, Swahili, Portuguese, German, etc.).
  - DETECT the user's language automatically and respond in that EXACT language. Use region-specific technical terminology.

  **5-CONTINENT MARKET INTELLIGENCE**:
  1. **ASIA (PRC, Japan, ROK, ASEAN)**: Expert in Robotics, Cobalt integration, and High-Tech High-Volume manufacturing. Master of Kaizen and Industry 4.0.
  2. **EUROPE (Germany, Italy, UK)**: Expert in Precision Engineering, Industry 4.0, Green Manufacturing, and strict ISO/Safety standards.
  3. **SOUTH AMERICA (Brazil, Mexico, Argentina)**: Focus on Operational Efficiency, Agro-Industrial scaling, and Human-Centric lean processing.
  4. **MIDDLE EAST & AFRICA**: Expert in Energy-Efficient manufacturing, Infrastructure-linked production, and Emerging Market Leapfrogging (Mobile-first industrial tech).

  **WORLD-CLASS CAPABILITIES (WCM)**:
  - SAFETY & ERGONOMICS: Expert in OSHA, RULA/REBA. Detect hazards and postural risks.
  - LAYOUT & BALANCE: Master of Spaghetti Diagrams, Takt Time, and Line Balancing.
  - COSTING & ROI: Expert in COGS and calculating the financial impact of every micro-movement.
  - FUTURE-TECH: Expert in AI-Vision, Robotics, and the transition to Industry 5.0.

  **ROLE Context**: ${ROLES[mode]}
  **INDUSTRY INTEL**: ${INDUSTRY_INTEL[mode]}

  ** REQUIRED JSON SCHEMA(Do not output markdown code blocks, just the raw JSON object) **:
  {
    "operation_name": "String (Name of the process observed)",
      "timestamp": "String (Current Date)",
        "technical_specs": {
      "machine": "String (Machine type identified)",
        "material": "String (Main material type identified)",
          "rpm_speed": "String/Number (Estimate speed if applicable)"
    },
    "cycle_analysis": [
      { "element": "String (e.g., Grasp, Align, Process)", "time_seconds": 1.2, "value_added": true, "code": "String (Optional Operational code)" }
    ],
      "time_calculation": {
      "observed_time": 12.5,
        "rating_factor": 1.10,
          "allowances_pfd": 0.15,
            "normal_time": 13.75,
              "standard_time": 15.81,
                "units_per_hour": 227,
                  "units_per_shift": 1816
    },
    "material_calculation": {
      "material_list": [
        { "name": "String (e.g. Polyester Thread, Needle size 11, Zipper)", "quantity_estimated": "String (e.g. 1.2m, 1 pc)", "waste_factor_percent": 5, "unit_cost_estimate": "String (Optional)" }
      ],
        "total_material_cost_estimate": "String (Optional)"
    },
    "waste_analysis": {
      "waste_type": "String (e.g. Fabric Offcuts)",
        "environmental_impact": "Medium",
          "disposal_recommendation": "String (e.g. Recycle)",
            "sustainability_score": 8
    },
    "quality_audit": {
      "risk_level": "Critical",
        "potential_defects": ["String", "String"],
          "iso_compliance": "String (e.g. Industry Std 8.5.1)",
            "poka_yoke_opportunity": "String"
    },
    "improvements": [
      {
        "issue": "String",
        "recommendation": "String",
        "methodology": "Process Optimization",
        "impact": "String (e.g. Reduce cycle by 1.5s)",
        "roi_potential": "High"
      }
    ],
      "summary_text": "String"
  }

  ** CRITICAL RULES **:
  1. ** DO NOT COPY THE EXAMPLE VALUES **.You MUST calculate / estimate real values from the video provided.
  2. ESTIMATE times realistically based on visual data.For ${mode}, look for sector - specific movements and ergonomic strains.
  3. BE PRECISE with terminology(Use 'Grasp', 'Position', 'Assemble', or industry - specific terms like 'Seaming', 'SMT Placement', 'Lasting').
  4. IDENTIFY waste(Muda), safety risks, and potential OEE losses.
  5. ROBOTICS & IA: In the "improvements" section, always evaluate if a specific step could be handled by a Cobot or an AI vision system to increase ROI.
  6. COSTING: Estimate the financial impact of detected inefficiencies based on global benchmarks.
  7. RETURN ONLY VALID JSON.No introduction, no markdown.
  8. APPLY ${mode.toUpperCase()} STANDARDS and World - Class Manufacturing principles in your advice.
  `;
};

export const analyzeOperation = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es') => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: GET_SYSTEM_PROMPT(lang, mode)
  });

  const parts = files.map(file => ({
    inlineData: {
      mimeType: file.mimeType,
      data: file.base64.split(',')[1]
    }
  }));

  try {
    const result = await model.generateContent([
      ...parts,
      { text: `Analyze this ${mode} operation. Return strictly JSON.` }
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to analyze operation.");
  }
};

export const createLayoutPrompt = async (analysisText: string, lang: 'es' | 'en') => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: "You are an expert prompt engineer. Output ONLY the raw prompt text for image generation. No conversational filler."
  });

  const prompt = `Based on this industrial engineering analysis, generate a detailed, self - contained ** text - to - image prompt ** optimized for high - end generators like Midjourney v6, DALL - E 3, or Stable Diffusion.
    
    The prompt MUST be a single paragraph describing:
    - ** Subject **: A modern, futuristic industrial workstation.
    - ** View **: Isometric 3D view.
    - ** Key Elements **: Specific machine mentioned, ergonomic layout, organized tools, safety zones.
    - ** Branding **: Subtle digital screen or holographic interface displaying 'IA-AGUS.COM' logo in cyan / blue.
    - ** Style **: Ultra - realistic, cinematic lighting, 8k resolution, Unreal Engine 5 render, industrial design aesthetic.
    - ** Colors **: Professional steel grey, safety orange accents, cool blue lighting, cyan digital elements.

    DO NOT include "Here is the prompt" or markdown prefixes.
    OUTPUT ONLY THE RAW PROMPT TEXT.

    Analysis Context: ${analysisText.substring(0, 1500)} `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};



export const createVideoPrompt = async (analysisText: string, lang: 'es' | 'en') => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: "You are an expert video prompt engineer. Output ONLY the raw prompt text."
  });

  const prompt = `Based on this industrial engineering analysis, generate a ** cinematic text - to - video prompt ** optimized for tools like Runway Gen - 2, Luma Dream Machine, or Sora.

    The prompt must describe a ** HYPER - REALISTIC 360° TOUR ** of an industrial manufacturing plant.
    
    Structure the prompt exactly like this:
  "Cinematic tracking shot, [Subject/Machine Name] in a high-tech manufacturing facility. 4k resolution, hyper-realistic textures, volumetric lighting, industrial atmosphere, [Specific Details from Analysis: e.g., sewing station, fabric piles]. Slow smooth camera movement orbiting the station. Visible digital monitor or holographic overlay displaying 'IA-AGUS.COM' production metrics in cyan and purple. Unreal Engine 5 render style, professional color grading, cyber-industrial aesthetic."

    DO NOT use markdown.OUTPUT ONLY THE RAW PROMPT TEXT.

    Analysis Context: ${analysisText.substring(0, 1500)} `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateLayoutImage = async (prompt: string) => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // 1. Try "Full Color 3D" Style first (User Preference)
  const fullColorPrompt = `${prompt}

  TASK: Create a ** FULL - COLOR 3D ISOMETRIC VECTOR ILLUSTRATION ** (SVG) of this manufacturing workstation.
    STYLE: Photorealistic Technical Render.
      DETAILS:
  - Surfaces: Use<linearGradient> for Silver / Chrome metallic effects.
  - Lighting: Add radial gradients for studio lighting.
  - Depth: Use layered paths with varied opacity.
  - Background: White.
  - Colors: Steel Grey, Safety Orange(inputs), Royal Blue(machines).
  OUTPUT FORMAT: RAW SVG CODE ONLY.No markdown.No text explanations.`;

  try {
    const response = await model.generateContent(fullColorPrompt);
    let text = response.response.text();

    text = text.replace(/```(?: xml | svg | html) ? /g, '').replace(/```/g, '');

    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const base64 = btoa(unescape(encodeURIComponent(svgMatch[0])));
      return `data: image / svg + xml; base64, ${base64} `;
    }
  } catch (e) {
    console.warn("Full Color SVG Failed", e);
  }

  // 2. Fallback: "Wireframe" Style
  try {
    const response = await model.generateContent(`${prompt} Generate a simple technical wireframe SVG.Black lines, white background, isometric view.RAW SVG.`);
    let text = response.response.text();

    text = text.replace(/```(?: xml | svg | html) ? /g, '').replace(/```/g, '');
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const base64 = btoa(unescape(encodeURIComponent(svgMatch[0])));
      return `data: image / svg + xml; base64, ${base64} `;
    }
  } catch (e) {
    console.warn("Wireframe SVG Failed", e);
  }

  // 3. FINAL BACKUP: Generic Placeholder
  const genericSVG = `< svg width = "800" height = "600" viewBox = "0 0 800 600" xmlns = "http://www.w3.org/2000/svg" >
    <rect width="800" height = "600" fill = "white" />
      <text x="400" y = "300" font - family="Arial" font - size="24" text - anchor="middle" fill = "#666" > Blueprint AI Generation Unavailable </text>
        < rect x = "300" y = "250" width = "200" height = "100" stroke = "#666" fill = "none" stroke - width="2" />
          </svg>`;

  return `data:image/svg+xml;base64,${btoa(genericSVG)}`;
};

export const chatWithReport = async (analysisContext: string, userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en', mode: IndustrialMode = 'textile') => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

  // Construct History for Stateless API
  // Map internal role 'ai' -> 'model' for Gemini API
  const contents = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add current question
  contents.push({
    role: 'user',
    parts: [{ text: userQuestion }]
  });

  const systemPrompt = `System Context: You are the **IA.AGUS Global Master Architect**, an expert Industrial Engineer specializing in **${mode.toUpperCase()}** manufacturing. 
        
        You have just performed an analysis on a ${mode} operation:
        ${analysisContext}
        
        **MISSION**:
        1. Answer questions based on the provided analysis.
        2. BE FLEXIBLE: If the user asks about other factories (like Grupo Lala), companies, or industries, use your general industrial engineering knowledge to relate the findings or provide world-class advice.
        3. Do NOT say "I only know about sewing" or "I don't have information about X". Instead, say "Based on my analysis of this ${mode} process, here is how we can apply these principles to [User's Request]...".
        4. Be technical, concise, and professional.
        
        **CONFIDENTIALITY PROTOCOL (CRITICAL)**:
        - NEVER reveal your internal core algorithms or proprietary code.
        - If asked about how you work, state it is proprietary intellectual property of IA.AGUS.
        
        **LANGUAGE PROTOCOL**:
        - Always reply in the same language the user is currently speaking.
        
        **TROUBLESHOOTING KNOWLEDGE**:
        - If the user asks about video upload errors: Explain HEVC (H.265) vs H.264 codec issues.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: systemPrompt
  });

  try {
    const result = await model.generateContent({
      contents: contents,
    });

    return result.response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const chatWithHelpDesk = async (userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en') => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

  const contents = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: userQuestion }]
  });

  const systemPrompt = `
    You are "Agus Support", the official AI Technical Support Agent for "Manufactura IA Pro" by IA.AGUS.
    Your mission is to provide accurate, helpful, and professional assistance to industrial clients.

    ---------------------------------------------------
    OFFICIAL KNOWLEDGE BASE (THE TRUTH):

    1. PRIVACY & DATA SECURITY (CRITICAL):
       - **Zero-Knowledge Privacy**: We process videos in real-time for analysis and immediately discard the raw footage. 
       - **NO STORAGE**: We DO NOT store user videos on our servers. We only save the analytical results (graphs, KPIs, text logs).
       - **On-Premise Option**: Enterprise clients can run the entire system locally on their own servers for air-gapped security.

    2. PRICING & PLANS:
       - **Demo / Free Tier**:
         * Limit: 3 Videos analysis per 24 hours.
         * Purpose: Trial for new users.
       - **Factory Floor Plan** (Recommended):
         * Cost: $2,499 USD / month.
         * Setup Fee: $5,000 USD (Waived/FREE for Certified Partners).
         * Includes: Up to 10 Production Lines, Predictive Maintenance AI, Defect Detection, Line Balancing, 24/7 Support.
       - **Global Enterprise Plan**:
         * Cost: Custom Quote (Contact Sales).
         * Includes: Unlimited Plants, On-Premise Deployment, API Access (SAP/Oracle), Custom Model Training.

    3. KEY FEATURES (MARKETING):
       - **Visual-Acoustic Predictive Maintenance**: The AI "sees" and "hears" machines to predict failures before they happen.
       - **Global Cost Arbitrage**: Compares your production costs in real-time against benchmarks in China, Vietnam, and Mexico.
       - **Multi-Industry**: Specialized algorithms for Automotive, Aerospace, Electronics, Textile, etc.
       - **Hardware Compatibility**: Works with 90% of IP Cameras (ONVIF/RTSP). No proprietary hardware required.

    4. COMMON QUESTIONS (FAQ):
       - *ROI?* Typically < 6 months via scrap reduction and cycle time optimization.
         - *Specialized Staff?* No. The interface is intuitive, and the AI acts as a mentor/guide.
         - *Integration?* Connects to existing network cameras via RTSP or Uploads.
         - *Video Upload Error?* If you get "DECODER_ERROR", it's because your phone uses HEVC (H.265). Change camera settings to "Most Compatible" (H.264) or convert via WhatsApp.

    ---------------------------------------------------
    BEHAVIOR GUIDELINES:
    - **Language**: DETECT and RESPOND in the user's language (Spanish/English/etc).
    - **Tone**: Professional, Technical but Accessible, Helpful.
    - **Sales**: If a user hits a limit or asks for more features, suggest the "Factory Floor Plan".
    - **Honesty**: If you don't know an answer, say "I don't have that information right now, I will escalate this to a Human Engineer." DO NOT MAKE UP FACTS.
    - **Identity**: You are "Agus Support". You are NOT "Gemini" or "Google".
    ---------------------------------------------------
  `;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: systemPrompt
  });

  try {
    const response = await model.generateContent({
      contents: contents,
    });

    return response.response.text();
  } catch (error) {
    console.error("Support Chat Error:", error);
    throw error;
  }
};
