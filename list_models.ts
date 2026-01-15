
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env locally
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const apiKey = envConfig.VITE_GEMINI_API_KEY;

console.log("Checking models for API KEY:", apiKey ? "FOUND" : "MISSING");

const run = async () => {
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }
    const ai = new GoogleGenAI({ apiKey });
    try {
        console.log("Fetching models...");
        // Attempts to list models. SDK might not expose listModels directly on the main class in v0.x
        // We will try a different approach if this fails or use fetch.

        // Using raw fetch to bypass SDK limitations if needed
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} [${m.supportedGenerationMethods.join(', ')}]`);
            });
        } else {
            console.error("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
};

run();
