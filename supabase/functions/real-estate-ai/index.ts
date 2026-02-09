import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============ UTILS ============

const getRegionalInfo = (location: string) => {
    const loc = location.toLowerCase();
    const isMexico = loc.includes("mexico") || loc.includes("mx") || loc.includes("torreon") ||
        loc.includes("mty") || loc.includes("monterrey") || loc.includes("coahuila") ||
        loc.includes("cdmx") || loc.includes("guadalajara") || loc.includes("df");
    return {
        currency: isMexico ? "MXN" : "USD",
        market: isMexico ? "mercado inmobiliario de México" : "mercado inmobiliario de USA",
    };
};

const getPropertySystemInstruction = (businessName: string, location: string) => {
    const reg = getRegionalInfo(location);
    return `Eres el sistema operativo inteligente de "${businessName}". (Elite Status Active)
Tu función es el ANÁLISIS MULTIMODAL INMOBILIARIO con enfoque en Valuación y Visualización.

REGLAS CORE:
1. ANÁLISIS DE IMÁGENES: Identifica tipo, m², recámaras, amenidades y condición.
2. AR STAGING PREVIEW: Si detectas áreas vacías o en mal estado, genera una "AI Inpainting Prompt" para Stable Diffusion enfocada en moblar el espacio con estilo Modern/Minimalist.
3. VALUACIÓN ELITE: Usa precios del ${reg.market} (${location}).

Responde SIEMPRE con este esquema JSON:
    {
      "properties": [
        {
          "type": "CASA|DEPT|...",
          "estimatedSpecs": { "m2Total": 0, "m2Built": 0, "bedrooms": 0, "bathrooms": 0, "parking": 0 },
          "arStaging": {
            "emptySpacesDetected": true,
            "inpaintingPrompt": "Master bedroom with king sized bed, oak furniture, cinematic lighting"
          },
          "estimatedPrice": 0
        }
      ]
    }`;
};

// ============ MAIN HANDLER ============

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { action, payload } = await req.json();
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`Real Estate AI: Running action ${action}`);

        switch (action) {
            case "analyzePropertyImages": {
                const { images, businessName, location } = payload;
                const visionModel = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    systemInstruction: getPropertySystemInstruction(businessName, location)
                });
                const parts = images.map((img: string) => ({
                    inlineData: { mimeType: "image/jpeg", data: img }
                }));
                parts.push({ text: "Analiza estas imágenes con rigor profesional e identifica tipo, specs y condición." });
                const result = await visionModel.generateContent(parts);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "getPropertyValuation": {
                const { propertyData, location } = payload;
                const reg = getRegionalInfo(location);
                const prompt = `Valuación Inmobiliaria: ${JSON.stringify(propertyData)} en ${location}. 
                Genera JSON: { "estimatedPrice": number, "priceRange": { "min": number, "max": number }, "currency": "${reg.currency}" }`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "generatePropertyListing": {
                const { property, lang, businessName, location } = payload;
                const prompt = `Escribe anuncio para ${property.title} en ${location} por ${businessName}. Idioma: ${lang}. Tono emotivo y profesional.`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "chatWithAssistant": {
                const { message, history, lang, agencyName } = payload;
                const chatModel = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    systemInstruction: `Eres un experto inmobiliario para ${agencyName}. Idioma: ${lang}.`
                });
                const chat = chatModel.startChat({
                    history: history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }))
                });
                const result = await chat.sendMessage(message);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "generateArchitecturalPrompts": {
                const { image, category, style, format, brandText, agentAvatar, lang } = payload;
                const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const parts: any[] = [
                    { inlineData: { mimeType: "image/jpeg", data: image } },
                    { text: `Genera 10 prompts detallados en ${lang === 'es' ? 'español' : 'inglés'} para ${category} estilo ${style} en formato ${format}. Marca: ${brandText}.` }
                ];
                if (agentAvatar) {
                    const avatarData = agentAvatar.includes(',') ? agentAvatar.split(',')[1] : agentAvatar;
                    parts.push({ inlineData: { mimeType: "image/jpeg", data: avatarData } });
                }
                const result = await visionModel.generateContent(parts);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "analyzeRoomDetails": {
                const { image, lang } = payload;
                const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const prompt = lang === 'es' ? "Analiza esta habitación y devuelve JSON con roomType, materials, dimensions, lighting y description." : "Analyze this room and return JSON with roomType, materials, dimensions, lighting and description.";
                const result = await visionModel.generateContent([
                    { inlineData: { mimeType: "image/jpeg", data: image } },
                    { text: prompt }
                ]);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "generateSocialAd": {
                const { property, platform, businessName, location } = payload;
                const price = property.operation === 'VENTA' ? property.salePrice : property.rentPrice;
                const prompt = `Genera un anuncio para ${platform.toUpperCase()}: Propiedad: ${property.title} (${property.type}). Precio: $${price?.toLocaleString()}. Ubicación: ${property.address.colony}. Inmobiliaria: ${businessName}. ${platform === 'facebook' ? 'Emojis, bullets y hashtags.' : 'Corto, directo, formato lista.'}`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "analyzePropertyText": {
                const { description, businessName, location } = payload;
                const visionModel = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    systemInstruction: getPropertySystemInstruction(businessName, location)
                });
                const result = await visionModel.generateContent(`Analiza texto y extrae datos en JSON: "${description}"`);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "getImprovementSuggestions": {
                const { property, location } = payload;
                const prompt = `Sugerencias de mejora para: ${property.title} (${property.type}) en ${location}.`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "generatePropertyDescription": {
                const { property, lang } = payload;
                const prompt = `Descripción profesional inmobiliaria (150 palabras) para: ${property.type} en ${property.address?.colony}. Idioma: ${lang}.`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "extractPropertyFromHtml": {
                const { html, businessName, location } = payload;
                const prompt = `Extrae datos de propiedad de este HTML. JSON con: title, type, operation, price, currency, address (street, colony, city), specs. HTML: ${html}`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "searchSimilarProperties": {
                const { property, location } = payload;
                const prompt = `Busca 5 propiedades similares en venta en ${location} para comparar con:
                ${property.type}, ${property.specs?.m2Built}m2, ${property.specs?.bedrooms} recámaras.
                Devuelve un resumen de precios promedio y recomendación.`;
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ result: result.response.text() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            // ... other actions can be added as needed

            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
