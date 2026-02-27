/**
 * DeepSeek AI Service - IA AGUS PRO
 * High efficiency, low cost LLM provider for Manufacturing Analysis.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export const analyzeWithDeepSeek = async (prompt: string, systemPrompt: string = "Eres un experto ingeniero de procesos y manufactura.") => {
    if (!API_KEY) {
        console.error("❌ DeepSeek API Key missing!");
        throw new Error("API Key de DeepSeek no configurada");
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1, // Fixed low temperature for precision in manufacturing data
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error calling DeepSeek");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("🔥 DeepSeek Service Error:", error);
        throw error;
    }
};
