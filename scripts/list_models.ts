
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config({ path: '../.env.local' });

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    console.log("Checking models for API Key...");
    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });

    try {
        // List models is usually on the root client or via specific HTTP call if SDK doesn't expose it plainly
        // The node SDK has delete/get/list in the `models` namespace usually
        // But @google/genai might differ from @google/generative-ai

        // Let's try the standard fetch approach to be sure
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`);
        const data = await resp.json();

        if (data.models) {
            console.log("Available Models (v1alpha):");
            data.models.forEach((m: any) => {
                if (m.name.includes("gemini")) {
                    console.log(`- ${m.name} [Methods: ${m.supportedGenerationMethods?.join(", ")}]`);
                }
            });
        } else {
            console.error("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
