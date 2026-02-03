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

      const result = await model.generateContent([
        {
          text: `Eres un Ingeniero Industrial experto. Analiza este video de manufactura (${mode}).
        Genera un reporte técnico en ${lang === 'es' ? 'Español' : 'Inglés'}.
        REGLA CRÍTICA: Debes responder ÚNICAMENTE con un objeto JSON válido.
        
        EJEMPLO DE ESTRUCTURA:
        {
          "operation_name": "Nombre",
          "summary_text": "Breve descripción",
          "technical_specs": { "machine": "Manual", "material": "Tela" },
          "cycle_analysis": [
            { "element": "Cargar tela", "time_seconds": 2.5, "value_added": true, "therblig": "G", "start_time": "00:01", "end_time": "00:03" }
          ],
          "time_calculation": {
            "observed_time": 10.5,
            "rating_factor": 1.0,
            "allowances_pfd": 0.15,
            "normal_time": 10.5,
            "standard_time": 12.07,
            "units_per_hour": 298,
            "units_per_shift": 2384
          },
          "ergo_vitals": { "overall_risk_score": 3, "critical_body_part": "Espalda", "recommendation": "Ajustar altura" },
          "quality_audit": { "risk_level": "Low", "potential_defects": [], "iso_compliance": "ISO9001", "poka_yoke_opportunity": "None" },
          "material_calculation": { "material_list": [], "total_material_cost_estimate": "$0" },
          "waste_analysis": { "waste_type": "Retazos", "sustainability_score": 8, "environmental_impact": "Low", "disposal_recommendation": "Reciclar" },
          "improvements": [ { "issue": "Velocidad", "recommendation": "Capacitación", "impact": "Alta", "methodology": "Lean", "roi_potential": "Alto" } ]
        }` },
        ...parts
      ]);

      const text = result.response.text();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

      return new Response(JSON.stringify({ result: cleanJson }), {
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
