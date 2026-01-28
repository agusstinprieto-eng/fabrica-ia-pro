
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
let apiKey = '';
try {
    const envPath = path.join(__dirname, '../.env.local');
    // Using absolute path based on user info if relative fails
    const absolutePath = 'c:\\Users\\aguss\\Downloads\\IA Inteligencia Artificial\\IA.AGUS\\Desarrollo de Apps\\manufactura-ia-pro\\.env.local';

    let envContent = '';
    if (fs.existsSync(absolutePath)) {
        envContent = fs.readFileSync(absolutePath, 'utf8');
    } else if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_GEMINI_API_KEY=')) {
            apiKey = line.split('=')[1].trim().replace(/['"]/g, '');
            break;
        }
    }
} catch (error) {
    console.error("Error reading .env.local:", error.message);
}

if (!apiKey) {
    console.error("API KEY NOT FOUND");
    process.exit(1);
}

console.log(`Checking models for API Key: ...${apiKey.slice(-4)}`);

async function run() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log("Fetching v1beta...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n--- Available Models (v1beta) ---");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    // Check for bidi or realtime
                    const support = m.supportedGenerationMethods?.join(', ') || '';
                    console.log(`- ${m.name}`);
                    console.log(`  Support: ${support}`);
                }
            });
            console.log("---------------------------------\n");
        } else {
            console.log("V1Beta Error:", data);
        }

        console.log("Fetching v1alpha...");
        const urlAlpha = `https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`;
        const responseAlpha = await fetch(urlAlpha);
        const dataAlpha = await responseAlpha.json();

        if (dataAlpha.models) {
            console.log("\n--- Available Models (v1alpha) ---");
            dataAlpha.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name}`);
                    const support = m.supportedGenerationMethods?.join(', ') || '';
                    console.log(`  Support: ${support}`);
                }
            });
            console.log("----------------------------------\n");
        } else {
            console.log("V1Alpha Error:", dataAlpha);
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

run();
