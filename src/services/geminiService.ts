import { GoogleGenAI } from "@google/genai";
import { FileData } from "../types";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile';

const GET_SYSTEM_PROMPT = (lang: 'es' | 'en', mode: IndustrialMode) => {
  const isEs = lang === 'es';

  const MODES: Record<IndustrialMode, any> = {
    automotive: {
      role: isEs ? "Ingeniero de Manufactura Automotriz (Lean Six Sigma Black Belt)" : "Automotive Manufacturing Engineer (Lean Six Sigma Black Belt)",
      expert: isEs ? "Lean Manufacturing, Takt Time y Poka-Yokes" : "Lean Manufacturing, Takt Time and Poka-Yokes",
      tasks: isEs ?
        `1. ANÁLISIS DE CICLO: Identifica desperdicios(Muda / Mura / Muri).
         2. CALIDAL(POKA - YOKE): Detecta riesgos de ensamblaje incorrecto.
         3. ERGONOMÍA: Revisa posturas de ensamblaje bajo chaxis o motor(REBA).` :
        `1. CYCLE ANALYSIS: Identify wastes(Muda / Mura / Muri).
         2. QUALITY(POKA - YOKE): Detect incorrect assembly risks.
         3. ERGONOMICS: Review assembly postures under chassis / engine(REBA).`
    },
    aerospace: {
      role: isEs ? "Ingeniero Aeroespacial de Calidad y Procesos (AS9100)" : "Aerospace Quality & Process Engineer (AS9100)",
      expert: isEs ? "FOD Control, Trazabilidad y Tolerancias Cero" : "FOD Control, Traceability, and Zero Tolerance",
      tasks: isEs ?
        `1. FOD ALERT: Escanea buscando objetos extraños(Foreign Object Debris).
         2. TRAZABILIDAD: Verifica etiquetado y sellado de componentes críticos.
         3. PRECISIÓN: Valida el uso correcto de herramientas torqueadas.` :
        `1. FOD ALERT: Scan for Foreign Object Debris.
         2. TRACEABILITY: Verify critical component labeling and sealing.
         3. PRECISION: Validate correct use of torque tools.`
    },
    electronics: {
      role: isEs ? "Ingeniero de Procesos en Electrónica (IPC-A-610)" : "Electronics Process Engineer (IPC-A-610)",
      expert: isEs ? "Control ESD, Soldadura SMT/Through-hole" : "ESD Control, SMT/Through-hole Soldering",
      tasks: isEs ?
        `1. ESD CHECK: Verifica uso de pulseras / batas antiestáticas.
         2. SOLDADURA: Inspecciona calidad de los puntos de soldadura(brillo / forma).
         3. COMPONENTES: Detecta polaridad invertida o componentes faltantes.` :
        `1. ESD CHECK: Verify anti - static wristbands / smocks usage.
         2. SOLDERING: Inspect solder joint quality(wetting / fillet).
         3. COMPONENTS: Detect reversed polarity or missing components.`
    },
    textile: {
      role: isEs ? "Ingeniero Industrial Experto en Confección (MTM/GSD)" : "Industrial Engineer & Sewing Expert (MTM/GSD)",
      expert: isEs ? "Ergonomía (REBA) y Eficiencia de Costura" : "Ergonomics (REBA) and Sewing Efficiency",
      tasks: isEs ?
        `1. DESGLOSE MTM: Tomar, Posicionar, Coser, Descartar.
         2. THERBLIGS: Detectar movimientos ineficientes.` :
        `1. MTM BREAKDOWN: Grasp, Position, Sew, Dispose.
         2. THERBLIGS: Detect inefficient motions.`
    }
  };

  const selected = MODES[mode];

  return `Rol: ${selected.role}.
  Experto en: ${selected.expert}.

Objetivo: ${isEs ? "Analizar la operación mostrada para optimizar eficiencia, calidad y seguridad." : "Analyze the shown operation to optimize efficiency, quality, and safety."}
  
  Tareas de Análisis:
  ${selected.tasks}
  
  Elite Modules Active:
1. PREDICTIVE MAINTENANCE(Audio / Visual Pattern Analysis).
  2. ERGONOMIC HEALTH AUDIT(REBA / RULA).
  
  Formato de Respuesta Obligatorio(${isEs ? 'ESPAÑOL' : 'ENGLISH'}):
  # 1. ${isEs ? 'FICHA TÉCNICA' : 'TECHNICAL SHEET'}
  ** ${isEs ? 'Operación' : 'Operation'}:** [Name]
  ** Mode:** ${mode.toUpperCase()}
  ** ${isEs ? 'Alerta Crítica' : 'Critical Alert'}:** [Safety / Quality Risk]

  # 2. ${isEs ? 'ANÁLISIS DE PROCESO' : 'PROCESS ANALYSIS'}
  - ** ${isEs ? 'Eficiencia' : 'Efficiency'}:** [Observation]
  - ** ${isEs ? 'Calidad/FOD/ESD' : 'Quality/FOD/ESD'}:** [Observation]

  # 3. ELITE IMPROVEMENTS
  - ** Action:** [Recommendation]
    - ** Predictive Insight:** [Maintenance / Risk forecast]`;
};

export const analyzeOperation = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es') => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const parts = files.map(file => ({
    inlineData: {
      mimeType: file.mimeType,
      data: file.base64.split(',')[1]
    }
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: {
      parts: [
        ...parts,
        { text: `Analyze this ${mode} operation(${lang}).` }
      ]
    },
    config: {
      systemInstruction: GET_SYSTEM_PROMPT(lang, mode),
      temperature: 0.1,
      topP: 0.8,
      topK: 40
    }
  });

  return response.text;
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
      return `data: image / png; base64, ${part.inlineData.data} `;
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
