import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurada en Supabase.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (action === "analyze") {
      const { files, mode, lang } = payload;

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const fileNames = files.map((f: any) => f.name).join(", ");

      const prompt = `Eres un ALGORITMO de cronometraje industrial determinista. No eres creativo, eres exacto.
      
      INPUT: 12 fotogramas con marcas de tiempo: ${fileNames}.
      
      ALGORITMO DE DECISIÓN (Sigue estos pasos estrictamente):
      1. Escanea las imágenes secuencialmente.
      2. IDENTIFICA FRAME INICIAL (T_start): La primera imagen donde las manos del operario tocan el material o herramienta.
      3. IDENTIFICA FRAME FINAL (T_end): La última imagen antes de que las manos suelten la pieza o la dejen en reposo.
      4. CÁLCULO: observed_time = T_end - T_start.
      
      REGLA DE CONSISTENCIA:
      - Si ejecuto este análisis 100 veces, debes darme el mismo número 100 veces.
      - Basa tu decisión puramente en la evidencia visual de contacto físico.
      
      Responde SOLO con este JSON en ${lang}:
      {
        "operation_name": "Proceso Industrial Detectado",
        "summary_text": "Análisis basado en algoritmo determinista de fotogramas.",
        "technical_specs": { "machine": "string", "material": "string" },
        "cycle_analysis": [
          { "element": "Operación Principal", "time_seconds": 0.0, "value_added": true, "therblig": "G", "start_time": "T_start", "end_time": "T_end" }
        ],
        "time_calculation": { "observed_time": 0.0, "rating_factor": 1.0, "allowances_pfd": 0.12, "normal_time": 0.0, "standard_time": 0.0, "units_per_hour": 0, "units_per_shift": 0 },
        "ergo_vitals": { "overall_risk_score": 0, "posture_score": 0, "repetition_score": 0, "force_score": 0, "critical_body_part": "string", "recommendation": "string" },
        "multi_cycle_stats": { "cycles_observed": 1, "average_time": 0.0, "min_time": 0.0, "max_time": 0.0, "std_deviation": 0.0, "cp_score": 1.0, "stability_rating": "Stable (Algorithm)" },
        "quality_audit": { "risk_level": "Low", "potential_defects": [], "iso_compliance": "N/A", "poka_yoke_opportunity": "string" },
        "material_calculation": { "material_list": [], "total_material_cost_estimate": "$0" },
        "waste_analysis": { "waste_type": "None", "sustainability_score": 10, "environmental_impact": "Low", "disposal_recommendation": "string" },
        "improvements": [{ "issue": "string", "recommendation": "string", "impact": "Alta", "methodology": "Lean", "roi_potential": "High" }]
      }`;

      // Configuración DETERMINISTA (Temperature 0.0)
      const deterministicModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.0 }
      });

      const result = await deterministicModel.generateContent([{ text: prompt }, ...parts]);
      const text = result.response.text();

      // Limpieza JSON Robusta
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      const finalJson = cleanJson.substring(firstBrace, lastBrace + 1);

      return new Response(JSON.stringify({ result: finalJson }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para Chat y otras funciones
    if (action === "chat-report") {
      const { question, history } = payload;
      const chat = model.startChat({
        history: history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        }))
      });
      const response = await chat.sendMessage(question);
      return new Response(JSON.stringify({ result: response.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Acción no soportada en modo prueba" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
