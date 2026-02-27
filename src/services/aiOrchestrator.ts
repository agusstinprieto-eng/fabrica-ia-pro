/**
 * AI ORCHESTRATOR - AGUS PRO V2.0
 * Manages multiple AI providers for Manufacturing Analysis.
 */

import { analyzeWithDeepSeek } from './deepseekService';

export type AIProvider = 'gemini' | 'deepseek' | 'together' | 'openrouter';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const KEYS = {
    together: import.meta.env.VITE_TOGETHER_API_KEY,
    openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
};

export const getAIResponse = async (
    prompt: string,
    systemPrompt: string,
    provider: AIProvider = 'gemini',
    modelOverride?: string
) => {
    if (provider === 'deepseek') {
        return await analyzeWithDeepSeek(prompt, systemPrompt);
    }

    if (provider === 'together') {
        return await callOpenAICompatible(
            TOGETHER_API_URL,
            KEYS.together,
            modelOverride || "meta-llama/Llama-3-70b-chat-hf",
            prompt,
            systemPrompt
        );
    }

    if (provider === 'openrouter') {
        return await callOpenAICompatible(
            OPENROUTER_API_URL,
            KEYS.openrouter,
            modelOverride || "google/gemini-pro-1.5",
            prompt,
            systemPrompt
        );
    }

    return "Gemini usage is currently routed through internal services.";
};

async function callOpenAICompatible(url: string, key: string, model: string, prompt: string, system: string) {
    if (!key) throw new Error(`API Key missing for provider`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'IA AGUS PRO MANUFACTURING'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: system },
                { role: "user", content: prompt }
            ],
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Error calling AI provider");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
