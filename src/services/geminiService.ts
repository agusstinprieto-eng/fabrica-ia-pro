import { FileData } from "../types";
import { supabase } from "../lib/supabaseClient";
import { getAIResponse } from "./aiOrchestrator";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharmaceutical' | 'food' | 'metalworking' | 'medical_devices' | 'energy';

/** Video metadata captured during frame extraction — provides AI with temporal context */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameCount: number;
  frameInterval: number;
  timestamps: number[];
}

export interface CalibrationContext {
  distance?: string;
  weight?: string;
  fit?: string;
}

export const analyzeOperation = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es', videoMetadata?: VideoMetadata, videoFile?: { mimeType: string, base64: string }) => {
  const stored = localStorage.getItem('costura-ia-settings');
  const settings = stored ? JSON.parse(stored) : { aiEngine: 'deepseek' };
  const provider = settings.aiEngine || 'deepseek';

  try {
    if (provider !== 'gemini') {
      const prompt = `Analiza esta operación industrial en modo ${mode} y lenguaje ${lang}. ${videoMetadata ? `Metadatos de video: ${JSON.stringify(videoMetadata)}` : ''}`;
      const systemPrompt = "Eres un experto en ingeniería industrial y mejora de procesos. Devuelve el análisis en formato JSON estricto.";
      // Note: For now, non-gemini providers will only get the first few frames as text context or similar 
      // until we implement full vision routing if needed. But for high-token chat/knowledge, this is key.
      return await getAIResponse(prompt, systemPrompt, provider);
    }

    const invokePromise = supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'analyze',
        payload: {
          files: files.map(f => ({
            name: f.name,
            mimeType: f.mimeType,
            base64: f.base64.split(',')[1]
          })),
          mode,
          lang,
          videoMetadata: videoMetadata || null,
          videoData: videoFile || null
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 120 seconds. The video might be too long or the AI service is busy.')), 120000)
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze operation via Edge Function.");
  }
};

export const classifySegments = async (segmentFrames: { mimeType: string; base64: string }[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es') => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'classify_segments',
        payload: {
          files: segmentFrames,
          mode,
          lang
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Classification Error:", error);
    throw new Error("Failed to classify segments via Edge Function.");
  }
};

// Style Definition
export type PromptStyle = 'actual' | 'actual_feasible' | 'futuristic' | 'blueprint' | 'hyper-realistic';

export const createLayoutPrompt = async (analysisText: string, lang: 'es' | 'en', style: PromptStyle = 'actual') => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'generate-layout-prompt',
        payload: { analysisText, style, type: 'image' }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Prompt Error:", error);
    return "Error generating prompt.";
  }
};

export const createVideoPrompt = async (analysisText: string, lang: 'es' | 'en', style: PromptStyle = 'actual') => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'generate-video-prompt',
        payload: { analysisText, style, type: 'video' }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Video Prompt Error:", error);
    return "Error generating video prompt.";
  }
};

export const chatWithReport = async (analysisContext: string, userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en', mode: IndustrialMode = 'textile', useSearch: boolean = false, company: string = '') => {
  const stored = localStorage.getItem('costura-ia-settings');
  const settings = stored ? JSON.parse(stored) : { aiEngine: 'deepseek' };
  const provider = settings.aiEngine || 'deepseek';

  try {
    if (provider !== 'gemini') {
      const historyText = conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n');
      const prompt = `Contexto del Análisis: ${analysisContext}\n\nHistorial:\n${historyText}\n\nPregunta: ${userQuestion}`;
      return await getAIResponse(prompt, `Eres un ingeniero experto en ${mode}. Responde al usuario basándote en el reporte.`, provider);
    }

    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'chat-report',
        payload: {
          analysisContext,
          question: userQuestion,
          history: conversationHistory,
          mode,
          type: 'report',
          useSearch,
          company
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const chatWithHelpDesk = async (userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en', useSearch: boolean = false, company: string = '') => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'chat-support',
        payload: {
          question: userQuestion,
          history: conversationHistory,
          type: 'support',
          useSearch,
          company
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Support Chat Error:", error);
    throw error;
  }
};

export const improveMethod = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es', promptStyle: PromptStyle = 'actual_feasible') => {
  const stored = localStorage.getItem('costura-ia-settings');
  const settings = stored ? JSON.parse(stored) : { aiEngine: 'deepseek' };
  const provider = settings.aiEngine || 'deepseek';

  try {
    if (provider !== 'gemini') {
      const prompt = `Propón mejoras de método para esta operación industrial (${mode}, ${lang}). Estilo: ${promptStyle}`;
      return await getAIResponse(prompt, "Eres un consultor senior de Lean Manufacturing. Devuelve optimizaciones técnicas.", provider);
    }

    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'improve_method',
        payload: {
          files: files.map(f => ({
            name: f.name,
            mimeType: f.mimeType,
            base64: f.base64.split(',')[1]
          })),
          mode,
          lang,
          promptStyle
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Method Improvement Error:", error);
    throw new Error("Failed to analyze method improvement.");
  }
};

export const uploadAndIndexDocument = async (file: File, companyId: string) => {
  try {
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Trigger Indexing via Edge Function
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'index-document',
        payload: {
          filePath,
          fileName: file.name,
          companyId,
          mimeType: file.type
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Indexing Error:", error);
    throw error;
  }
};

export const chatWithKnowledge = async (question: string, history: any[], companyId: string) => {
  const stored = localStorage.getItem('costura-ia-settings');
  const settings = stored ? JSON.parse(stored) : { aiEngine: 'deepseek' };
  const provider = settings.aiEngine || 'deepseek';

  try {
    if (provider !== 'gemini') {
      const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
      const prompt = `Pregunta sobre Base de Conocimientos: ${question}\n\nHistorial:\n${historyText}`;
      return await getAIResponse(prompt, "Eres un asistente de soporte técnico industrial. Busca en la documentación y responde.", provider);
    }

    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'chat-knowledge',
        payload: {
          question,
          history,
          companyId
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Knowledge Chat Error:", error);
    throw error;
  }
};
