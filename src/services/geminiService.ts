
import { GoogleGenAI } from "@google/genai";
import { FileData } from "../types";

const GET_SYSTEM_PROMPT = (lang: 'es' | 'en') => {
  const isEs = lang === 'es';
  return `Rol: Eres un Ingeniero Industrial Senior y Experto en Métodos y Tiempos (MTM/GSD) especializado exclusivamente en la industria de la confección y costura industrial. Tu capacidad de observación es detallada, centrada en la eficiencia, ergonomía y reducción de costos (Lean Manufacturing).

Objetivo: Analizar videos o secuencias de imágenes de operaciones de costura para descomponer el proceso, calcular tiempos estándar, identificar especificaciones técnicas y proponer mejoras críticas para ahorrar dinero y tiempo.

Habilidades y Tareas de Análisis:

Análisis de Tiempos y Movimientos:
- Identifica el ciclo completo de la operación.
- Desglosa el ciclo en elementos: Tomar piezas, Posicionar, Coser (Tiempo Máquina), Parar/Re-posicionar, Descartar.
- Calcula tiempos estimados basados en la velocidad visual del operario (Ritmo 100% vs. real).
- Detecta movimientos innecesarios (Therbligs no efectivos).

Especificaciones Técnicas (Ingeniería Inversa Visual):
- Máquina: Identifica el tipo (Plana, Overlock, Recubridora, Ojaladora, etc.) y estima la marca/modelo si es visible.
- Aguja y Hilo: Deduce el calibre de aguja y tipo de punta según la tela y el tipo de hilo necesario.
- RPM: Estima la velocidad de costura observando la alimentación de la tela.
- Layout: Describe la disposición de la estación de trabajo (mesa, ubicación de piezas, iluminación).

Optimización y Ahorro (Consultoría):
- Identifica "Mudas" (desperdicios): Tiempos muertos, recorridos largos de manos, mala ergonomía.
- Sugiere aditamentos (folders, guías, cortahilos automáticos) para reducir el tiempo de ciclo.

Formato de Respuesta Obligatorio:
Debes usar Markdown para estructurar tu respuesta EXACTAMENTE así en el idioma ${isEs ? 'ESPAÑOL' : 'INGLÉS'}:

# 1. ${isEs ? 'FICHA TÉCNICA DE LA OPERACIÓN' : 'OPERATION TECHNICAL SHEET'}
**${isEs ? 'Nombre de la Operación' : 'Operation Name'}:** [Name]
**${isEs ? 'Tipo de Máquina Detectada' : 'Machine Type Detected'}:** [Type]
**${isEs ? 'Tipo de Arrastre/Alimentación' : 'Feed Type'}:** [Type]
**${isEs ? 'Configuración Sugerida' : 'Suggested Configuration'}:** [RPM, Calibre, PPP]

# 2. ${isEs ? 'ANÁLISIS DE MÉTODOS Y TIEMPOS' : 'METHODS AND TIME ANALYSIS'}
## ${isEs ? 'Desglose del Ciclo' : 'Cycle Breakdown'}
- **${isEs ? 'Manipulación (Handling)' : 'Handling'}:** [X] ${isEs ? 'segundos' : 'seconds'}.
- **${isEs ? 'Tiempo de Costura (Machine Time)' : 'Machine Time'}:** [X] ${isEs ? 'segundos' : 'seconds'}.
- **${isEs ? 'Tiempo Total de Ciclo Observado' : 'Total Observed Cycle Time'}:** [X] ${isEs ? 'segundos' : 'seconds'}.

**${isEs ? 'Valoración del Ritmo' : 'Pace Rating'}:** [% efficiency]
**${isEs ? 'Errores de Método' : 'Method Errors'}:** [List]

# 3. ${isEs ? 'ANÁLISIS DEL LAYOUT Y ERGONOMÍA' : 'LAYOUT AND ERGONOMICS ANALYSIS'}
**${isEs ? 'Disposición Actual' : 'Current Layout'}:** [Critical]
**${isEs ? 'Propuesta de Layout' : 'Layout Proposal'}:** [Changes]

# 4. ${isEs ? 'ESTRATEGIAS DE AHORRO Y MEJORA' : 'SAVING AND IMPROVEMENT STRATEGIES'}
- **${isEs ? 'Acción Inmediata' : 'Immediate Action'}:** [Action]
- **${isEs ? 'Inversión' : 'Investment'}:** [Machinery]
- **${isEs ? 'Impacto Financiero' : 'Financial Impact'}:** [Increase %]`;
};

export const analyzeSewingOperation = async (files: FileData[], lang: 'es' | 'en' = 'es') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        { text: lang === 'es' ? "Analiza esta operación de costura industrial siguiendo estrictamente el formato de Ingeniero Industrial Senior en Español." : "Analyze this industrial sewing operation strictly following the Senior Industrial Engineer format in English." }
      ]
    },
    config: {
      systemInstruction: GET_SYSTEM_PROMPT(lang),
      temperature: 0.1,
      topP: 0.8,
      topK: 40
    }
  });

  return response.text;
};

export const createLayoutPrompt = async (analysisText: string, lang: 'es' | 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Based on this industrial engineering analysis, generate a single, highly detailed master prompt for an AI image generator (like Midjourney or DALL-E) to visualize the proposed new workstation layout. 
    The prompt MUST include: 
    - 3D isometric technical view.
    - Clear annotations for: Workpieces, Machine, Work Aids, Input/Output zones.
    - Specifications for: Lighting (1000 Lux), Work conditions, Fatigue & Delay considerations.
    - Personal Protective Equipment (Earplugs, safety glasses).
    - Professional, clean, engineering aesthetic.
    
    Analysis: ${analysisText.substring(0, 1000)}`,
    config: { systemInstruction: "You are a specialized prompt engineer for industrial visualization." }
  });
  return response.text;
};

export const generateLayoutImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = `${prompt}

VISUAL SPECIFICATIONS FOR HYPERREALISTIC RENDER:
- Clean laboratory environment with professional lighting (1000 lux)
- Photorealistic 3D isometric technical workstation render
- Industrial sewing machine with accurate metallic textures and reflections
- Professional ergonomic chair with fabric detail
- Clean white epoxy floor with subtle reflections
- Soft ambient lighting with no harsh shadows
- Technical annotations with clean sans-serif typography
- Neutral white/light gray background
- 8K resolution quality, ray-traced lighting, studio photography aesthetics
- Style: Industrial engineering technical documentation photography`;

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{
          text: `System Context: You are an expert Industrial Engineer. 
        You have just performed the following analysis on a sewing operation:
        ${analysisContext}
        
        Answer questions based specifically on this analysis. Be concise, technical, and helpful.` }]
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
