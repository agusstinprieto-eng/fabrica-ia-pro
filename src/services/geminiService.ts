import { FileData } from "../types";
import { supabase } from "../lib/supabaseClient";

export type IndustrialMode = 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharmaceutical' | 'food' | 'metalworking';

export const analyzeOperation = async (files: FileData[], mode: IndustrialMode = 'textile', lang: 'es' | 'en' = 'es') => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'analyze',
        payload: {
          files: files.map(f => ({
            mimeType: f.mimeType,
            base64: f.base64.split(',')[1]
          })),
          mode,
          lang
        }
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze operation via Edge Function.");
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

export const chatWithReport = async (analysisContext: string, userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en', mode: IndustrialMode = 'textile', useSearch: boolean = false) => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'chat-report',
        payload: {
          analysisContext,
          question: userQuestion,
          history: conversationHistory,
          mode,
          type: 'report',
          useSearch
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

export const chatWithHelpDesk = async (userQuestion: string, conversationHistory: { role: string, content: string }[], lang: 'es' | 'en', useSearch: boolean = false) => {
  try {
    const { data, error } = await supabase.functions.invoke('industrial-ai', {
      body: {
        action: 'chat-support',
        payload: {
          question: userQuestion,
          history: conversationHistory,
          type: 'support',
          useSearch
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
