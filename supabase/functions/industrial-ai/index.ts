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
      
      Responde SOLO con este JSON en ${lang}. IMPORTANTE: Reemplaza todos los valores de ejemplo por análisis real basado en la imagen. NUNCA uses la palabra "string" en el resultado final:
      {
        "operation_name": "Nombre exacto de la operación detectada",
        "summary_text": "Resumen ejecutivo detallado del proceso observado.",
        "technical_specs": { "machine": "Marca/modelo de máquina detectada o Tipo", "material": "Tipo de tela o material" },
        "cycle_analysis": [
          { "element": "Descripción del elemento (ej. Tomar pieza, Coser lateral)", "time_seconds": 0.0, "value_added": true, "therblig": "Código GSD/MTM (ej. G1, P1)", "start_time": "T_start", "end_time": "T_end" }
        ],
        "time_calculation": { "observed_time": 0.0, "rating_factor": 1.0, "allowances_pfd": 0.12, "normal_time": 0.0, "standard_time": 0.0, "units_per_hour": 0, "units_per_shift": 0 },
        "ergo_vitals": { "overall_risk_score": 0, "posture_score": 0, "repetition_score": 0, "force_score": 0, "critical_body_part": "Zona crítica identificada", "recommendation": "Acción correctiva ergonómica" },
        "multi_cycle_stats": { "cycles_observed": 1, "average_time": 0.0, "min_time": 0.0, "max_time": 0.0, "std_deviation": 0.0, "cp_score": 1.0, "stability_rating": "Nivel de estabilidad" },
        "quality_audit": { "risk_level": "Low/Medium/High", "potential_defects": ["Defecto 1", "Defecto 2"], "iso_compliance": "Punto de norma ISO relevante", "poka_yoke_opportunity": "Propuesta de sistema a prueba de errores" },
        "material_calculation": { "material_list": [], "total_material_cost_estimate": "$0" },
        "waste_analysis": { "waste_type": "Tipo de desperdicio (muda)", "sustainability_score": 10, "environmental_impact": "Low/Medium/High", "disposal_recommendation": "Recomendación de disposición/reciclaje" },
        "improvements": [{ "issue": "Problema específico observado", "recommendation": "Mejora propuesta", "impact": "Alta/Media", "methodology": "Lean/Kaizen", "roi_potential": "High/Medium" }]
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

    if (action === "improve_method") {
      const { files, mode, lang } = payload;

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const prompt = `Act as a Senior Industrial Engineer & Methods Expert.
      Analyze these frames of a ${mode} operation.
      
      GOAL: Redesign the method and workstation layout to REDUCE CYCLE TIME and IMPROVE EFFICIENCY.
      CRITICAL: Identify the specific brand, model, and type of sewing machine or equipment visible in the frames (e.g. Juki, Brother, Pegasus, Kansai).
      
      REQUIRED OUTPUT (JSON Only):
      {
        "current_method_issues": ["List 3-5 inefficiencies, wasted motions, or poor layout issues observed"],
        "efficiency_loss_percentage": "Estimated % of time wasted (number only, e.g. 15)",
        "layout_strategy": "Name of the new layout strategy (e.g. 'U-Shaped Cell', 'Gravity Feed Setup', 'Bimanual Fixture')",
        "key_changes": ["3-5 specific changes to implement (e.g. 'Move bins to left hand reach', 'Add funnel fixture')"],
        "estimated_time_reduction": "Estimated new cycle time reduction (e.g. '2.5s per unit')",
        "roi_impact": "High/Medium/Low - Brief justification",
        "image_prompt_title": "Visualizing the Improved Station",
        "image_prompt": "A high-fidelity, photorealistic industrial design render of the OPTIMIZED ${mode} workstation. It features: [INSERT YOUR PROPOSED LAYOUT DETAILS HERE]. The layout centers around a [INSERT DETECTED MACHINE BRAND AND MODEL HERE] to match the input video. The workstation is ergonomic, well-lit, and organized with 5S principles. Include a subtle, high-tech digital display or brand label on the machinery showing 'IA-AGUS.COM' glowing softly. Cinematic lighting, 8k resolution, unreal engine 5 style."
      }
      
      Respond in ${lang === 'es' ? 'Spanish' : 'English'}. JSON ONLY.`;

      const creativeModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.4 }
      });

      const result = await creativeModel.generateContent([{ text: prompt }, ...parts]);
      const text = result.response.text();

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
