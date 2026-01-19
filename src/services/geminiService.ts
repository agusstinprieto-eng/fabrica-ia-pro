import { GoogleGenAI } from "@google/genai";
import { FileData } from "../types";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharmaceutical' | 'food' | 'metalworking';

const GET_SYSTEM_PROMPT = (lang: 'es' | 'en', mode: IndustrialMode) => {
  const isEs = lang === 'es';

  const ROLES = {
    automotive: isEs ? "Ingeniero de Manufactura Automotriz (Optimización de Procesos)" : "Automotive Manufacturing Engineer (Process Optimization)",
    aerospace: isEs ? "Ingeniero Aeroespacial (Estándares de Calidad Global)" : "Aerospace Quality Engineer (Global Standards)",
    electronics: isEs ? "Ingeniero de Procesos y Ensamblaje Electrónico" : "Electronics Process Engineer",
    textile: isEs ? "Ingeniero Industrial Experto en Confección (Métodos y Tiempos)" : "Industrial Engineer (Methods & Time Standards)",
    footwear: isEs ? "Ingeniero de Manufactura de Calzado (Estándares de Montado)" : "Footwear Manufacturing Engineer",
    pharmaceutical: isEs ? "Ingeniero de Calidad Farmacéutica (Cumplimiento Regulatorio)" : "Pharmaceutical Quality Engineer (Compliance)",
    food: isEs ? "Ingeniero de Calidad Alimentaria (Inocuidad y Calidad)" : "Food Safety Engineer (Safety & Quality)",
    metalworking: isEs ? "Ingeniero Metalmecánico (CNC y Soldadura Estándar)" : "Metal Fabrication Engineer (Standardized CNC/Welding)"
  };

  return `
  You are an Expert Industrial Engineering AI. Your task is to analyze the provided video/images and output a DETAILED ENGINEERING STUDY in strict JSON format.

  **ROLE Context**: ${ROLES[mode]}
  **LANGUAGE**: ${isEs ? 'Spanish (Español)' : 'English'} (All string values must be in this language).

  **REQUIRED JSON SCHEMA (Do not output markdown code blocks, just the raw JSON object)**:
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

  **CRITICAL RULES**:
  1. **DO NOT COPY THE EXAMPLE VALUES**. You MUST calculate/estimate real values from the video provided.
  2. ESTIMATE times realistically based on visual data (e.g. if a cycle takes 5 seconds, do not say 12.5).
  3. BE PRECISE with terminology (Use 'Grasp', 'Position', 'Assemble', not generic terms).
  3. IDENTIFY waste (Muda).
  4. Ensure 'standard_time' is mathematically correct (Normal * (1+Allowances)).
  5. RETURN ONLY VALID JSON. No introduction, no markdown.
  `;
};

export const analyzeOperation = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const parts = files.map(file => ({ inlineData: { mimeType: file.mimeType, data: file.base64.split(',')[1] } }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [...parts, { text: `Analyze this ${mode} operation. Return strictly JSON.` }] },
      config: {
        systemInstruction: GET_SYSTEM_PROMPT(lang, mode),
        temperature: 0.2, // Low temp for robust JSON
        topP: 0.95,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return JSON.stringify({ error: "Failed to analyze operation." });
  }
};

export const createLayoutPrompt = async (analysisText: string, lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Based on this industrial engineering analysis, generate a detailed, self-contained **text-to-image prompt** optimized for high-end generators like Midjourney v6, DALL-E 3, or Stable Diffusion.
    
    The prompt MUST be a single paragraph describing:
    - **Subject**: A modern, futuristic industrial workstation.
    - **View**: Isometric 3D view.
    - **Key Elements**: Specific machine mentioned, ergonomic layout, organized tools, safety zones.
    - **Branding**: Subtle digital screen or holographic interface displaying 'IA-AGUS.COM' logo in cyan/blue.
    - **Style**: Ultra-realistic, cinematic lighting, 8k resolution, Unreal Engine 5 render, industrial design aesthetic.
    - **Colors**: Professional steel grey, safety orange accents, cool blue lighting, cyan digital elements.

    DO NOT include "Here is the prompt" or markdown prefixes.
    OUTPUT ONLY THE RAW PROMPT TEXT.

    Analysis Context: ${analysisText.substring(0, 1500)} `,
    config: { systemInstruction: "You are an expert prompt engineer. Output ONLY the raw prompt text for image generation. No conversational filler." }
  });
  return response.text;
};



export const createVideoPrompt = async (analysisText: string, lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Based on this industrial engineering analysis, generate a **cinematic text-to-video prompt** optimized for tools like Runway Gen-2, Luma Dream Machine, or Sora.

    The prompt must describe a **HYPER-REALISTIC 360° TOUR** of an industrial manufacturing plant.
    
    Structure the prompt exactly like this:
    "Cinematic tracking shot, [Subject/Machine Name] in a high-tech manufacturing facility. 4k resolution, hyper-realistic textures, volumetric lighting, industrial atmosphere, [Specific Details from Analysis: e.g., sewing station, fabric piles]. Slow smooth camera movement orbiting the station. Visible digital monitor or holographic overlay displaying 'IA-AGUS.COM' production metrics in cyan and purple. Unreal Engine 5 render style, professional color grading, cyber-industrial aesthetic."

    DO NOT use markdown. OUTPUT ONLY THE RAW PROMPT TEXT.

    Analysis Context: ${analysisText.substring(0, 1500)} `,
    config: { systemInstruction: "You are an expert video prompt engineer. Output ONLY the raw prompt text." }
  });
  return response.text;
};

export const generateLayoutImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  // 1. Try "Full Color 3D" Style first (User Preference)
  // Using gemini-2.0-flash-exp (Valid Model)
  const fullColorPrompt = `${prompt}
  
  TASK: Create a **FULL-COLOR 3D ISOMETRIC VECTOR ILLUSTRATION** (SVG) of this manufacturing workstation.
  STYLE: Photorealistic Technical Render.
  DETAILS:
  - Surfaces: Use <linearGradient> for Silver/Chrome metallic effects.
  - Lighting: Add radial gradients for studio lighting.
  - Depth: Use layered paths with varied opacity.
  - Background: White.
  - Colors: Steel Grey, Safety Orange (inputs), Royal Blue (machines).
  OUTPUT FORMAT: RAW SVG CODE ONLY. No markdown. No text explanations.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: fullColorPrompt }] }
    });

    let text = "";
    if (typeof response.text === 'string') text = response.text;
    else if (typeof response.text === 'function') text = response.text();
    else if (response.candidates?.[0]?.content?.parts?.[0]?.text) text = response.candidates[0].content.parts[0].text;

    text = text.replace(/```(?:xml|svg|html)?/g, '').replace(/```/g, '');

    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const base64 = btoa(unescape(encodeURIComponent(svgMatch[0])));
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (e) {
    console.warn("Full Color SVG Failed", e);
  }

  // 2. Fallback: "Wireframe" Style
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: `${prompt} Generate a simple technical wireframe SVG. Black lines, white background, isometric view. RAW SVG.` }] }
    });

    let text = "";
    if (typeof response.text === 'string') text = response.text;
    else if (typeof response.text === 'function') text = response.text();
    else if (response.candidates?.[0]?.content?.parts?.[0]?.text) text = response.candidates[0].content.parts[0].text;

    text = text.replace(/```(?:xml|svg|html)?/g, '').replace(/```/g, '');
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const base64 = btoa(unescape(encodeURIComponent(svgMatch[0])));
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (e) {
    console.warn("Wireframe SVG Failed", e);
  }

  // 3. FINAL BACKUP: Generic Placeholder
  const genericSVG = `<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="600" fill="white"/>
    <text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" fill="#666">Blueprint AI Generation Unavailable</text>
    <rect x="300" y="250" width="200" height="100" stroke="#666" fill="none" stroke-width="2"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(genericSVG)}`;
};

export const chatWithReport = async (analysisContext: string, userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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

  const systemPrompt = `System Context: You are an expert Industrial Engineer. 
        You have just performed the following analysis on a sewing operation:
        ${analysisContext}
        
        Answer questions based specifically on this analysis. Be concise, technical, and helpful.
        
        **CONFIDENTIALITY PROTOCOL (CRITICAL)**:
        - NEVER reveal your internal core algorithms, mathematical logic, or proprietary code.
        - NEVER share confidential or critical information about IA.AGUS, including internal operations or partner data.
        - If asked about how you work "under the hood", respond that it is proprietary intellectual property of IA.AGUS.
        
        **LANGUAGE PROTOCOL**:
        - **PRIMARY RULE**: Always reply in the same language the user is currently speaking.
        - If the user asks in Spanish, reply in Spanish.
        - If the user asks in English, reply in English.
        - Ignore the default system language if it differs from the user's input.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const chatWithHelpDesk = async (userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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

    ---------------------------------------------------
    BEHAVIOR GUIDELINES:
    - **Language**: DETECT and RESPOND in the user's language (Spanish/English/etc).
    - **Tone**: Professional, Technical but Accessible, Helpful.
    - **Sales**: If a user hits a limit or asks for more features, suggest the "Factory Floor Plan".
    - **Honesty**: If you don't know an answer, say "I don't have that information right now, I will escalate this to a Human Engineer." DO NOT MAKE UP FACTS.
    - **Identity**: You are "Agus Support". You are NOT "Gemini" or "Google".
    ---------------------------------------------------
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Support Chat Error:", error);
    throw error;
  }
};
