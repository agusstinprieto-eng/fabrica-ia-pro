import { GoogleGenAI } from "@google/genai";
import { FileData } from "../types";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile';

const GET_SYSTEM_PROMPT = (lang: 'es' | 'en', mode: IndustrialMode) => {
  const isEs = lang === 'es';

  const ROLES = {
    automotive: isEs ? "Ingeniero de Manufactura Automotriz (Lean Six Sigma)" : "Automotive Manufacturing Engineer",
    aerospace: isEs ? "Ingeniero Aeroespacial (AS9100)" : "Aerospace Quality Engineer",
    electronics: isEs ? "Ingeniero de Procesos IPC-A-610" : "Electronics Process Engineer",
    textile: isEs ? "Ingeniero Industrial Experto en Confección (MTM/GSD)" : "Industrial Engineer (MTM/GSD)"
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
      { "element": "String (e.g., Grasp, Align, Process)", "time_seconds": 1.2, "value_added": true, "code": "String (Optional MTM code)" }
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
      "iso_compliance": "String (e.g. ISO 9001:8.5.1)",
      "poka_yoke_opportunity": "String"
    },
    "improvements": [
      { 
        "issue": "String", 
        "recommendation": "String", 
        "methodology": "Lean",
        "impact": "String (e.g. Reduce cycle by 1.5s)",
        "roi_potential": "High"
      }
    ],
    "summary_text": "String"
  }

  **CRITICAL RULES**:
  1. ESTIMATE times realistically based on visual data.
  2. BE PRECISE with terminology (Use 'Grasp', 'Position', 'Assemble', not generic terms).
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
    contents: `Based on this industrial engineering analysis, generate a single, highly detailed master prompt for an AI image generator(like Midjourney or DALL - E) to visualize the proposed new workstation layout. 
    The prompt MUST include:
  - 3D isometric technical view.
    - Clear annotations for: Workpieces, Machine, Work Aids, Input / Output zones.
    - Specifications for: Lighting(1000 Lux), Work conditions, Fatigue & Delay considerations.
    - Personal Protective Equipment(Earplugs, safety glasses).
    - Professional, clean, engineering aesthetic.

    Analysis: ${analysisText.substring(0, 1000)} `,
    config: { systemInstruction: "You are a specialized prompt engineer for industrial visualization." }
  });
  return response.text;
};

export const generateLayoutImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const finalPrompt = `${prompt}

VISUAL SPECIFICATIONS FOR TECHNICAL BLUEPRINT:
  - 3D Isometric Technical Wireframe / Blueprint style
    - High contrast: White background, dark grey engineering lines
      - Clearly labeled zones(Input, Output, Operator, Machine)
        - Floating text labels pointing to key components
          - "Exploded view" aesthetic for clarity
            - Data - driven industrial design
    - No decorative elements, purely functional
      - 8K Technical Render`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: finalPrompt }] },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const chatWithReport = async (analysisContext: string, userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{
          text: `System Context: You are an expert Industrial Engineer. 
        You have just performed the following analysis on a sewing operation:
        ${analysisContext}
        
        Answer questions based specifically on this analysis.Be concise, technical, and helpful.` }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to answer technical questions about this analysis." }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ] as any
  });

  const result = await chat.sendMessage(userQuestion);
  return result.response.text();
};
