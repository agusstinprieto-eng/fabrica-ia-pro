import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, payload } = body;
    console.log(`Action received: ${action}`);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      throw new Error("GEMINI_API_KEY no configurada en Supabase.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // ABSOLUTE DETERMINISM: temperature=0, topP=1, topK=1
    const defaultModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.0, // CRITICAL: No creativity for time measurement
        topP: 1.0,  // Maximum determinism
        topK: 1     // Only consider top choice
      }
    });

    if (action === "analyze") {
      console.log("Processing 'analyze' action...");
      const { files, mode, lang } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing or invalid 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are a FRAME-BY-FRAME VIDEO TIME ANALYST (NOT an estimator).
      
      CRITICAL METHOD:
      You will receive a SEQUENCE of video frames. Analyze them AS A TIMELINE, not as isolated images.
      
      PHASE 1 - DETECT INDUSTRY SECTOR:
      - Textile/Garment: Sewing machines, fabric, thread
      - Metalworking/CNC: Metal parts, chips, machine tools
      - Assembly: Components, fasteners, stations
      - Food/Packaging: Food products, packaging
      - General Manufacturing: Other operations
      
      PHASE 2 - ADVANCED INDUSTRIAL ANALYSIS:
      1. MOTION TRANSITIONS: IDENTIFY exactly when actions start/end.
      2. MUDA DISCOVERY (8 WASTES): Detect Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, and Unused Talent (Skills). Score each 0-10 (10 = High Waste).
      3. 5S VISUAL AUDIT: Evaluate Sort, Set in Order, Shine, Standardize, and Sustain. Score 1-5 (5 = Excellent).
      4. SAFETY COMPLIANCE: Audit PPE (Safety glasses, gloves, vest, helmets), detect trip hazards, and ergonomic danger zones.
      
      STRICT OUTPUT (JSON):
      {
        "operation_name": "string",
        "technical_specs": { 
          "machine": "string (EXACT BRAND)", 
          "material": "string",
          "rpm_speed": "string"
        },
        "cycle_analysis": [
          { 
            "element": "string", 
            "time_seconds": number,
            "frame_start": number,
            "frame_end": number,
            "value_added": boolean, 
            "therblig": "string" 
          }
        ],
        "time_calculation": {
          "observed_time": number,
          "normal_time": number,
          "rating_factor": number,
          "allowances_pfd": number,
          "standard_time": number,
          "units_per_hour": number
        },
        "quality_audit": {
          "risk_level": "Low" | "Medium" | "High" | "Critical",
          "potential_defects": ["string"],
          "poka_yoke_opportunity": "string",
          "iso_compliance": "string"
        },
        "ergo_vitals": {
          "overall_risk_score": number,
          "posture_score": number,
          "force_score": number,
          "repetition_score": number,
          "critical_body_part": "string",
          "recommendation": "string"
        },
        "waste_analysis": {
          "waste_type": "string",
          "environmental_impact": "string",
          "disposal_recommendation": "string",
          "sustainability_score": number
        },
        "lean_metrics": {
          "muda_scores": {
            "transport": number, "inventory": number, "motion": number, "waiting": number,
            "overproduction": number, "overprocessing": number, "defects": number, "skills": number
          },
          "five_s_audit": {
            "seiri": number, "seiton": number, "seiso": number, "seiketsu": number, "shitsuke": number, "overall": number
          },
          "kaizen_blitz_goals": ["string"],
          "takt_time_alignment": "string"
        },
        "safety_audit": {
          "ppe_detected": ["string"],
          "ppe_missing": ["string"],
          "hazard_zones_violations": number,
          "safety_score": number
        },
        "improvements": [
          { 
            "methodology": "string",
            "issue": "string",
            "recommendation": "string", 
            "impact": "string",
            "roi_potential": "string" 
          }
        ],
        "summary_text": "string",
        "image_prompt": "string"
      }
      
      Language: ${lang || 'es'}. ANALYZE FRAME SEQUENCE DETERMINISTICALLY.`;

      const userPrompt = `Analyze this operation of ${mode || 'manufacturing'}. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
        ...parts
      ]);

      const text = result.response.text();
      console.log("AI Analysis response received.");

      return new Response(JSON.stringify({ result: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "improve_method") {
      console.log("Processing 'improve_method' action...");
      const { files, mode, lang, promptStyle = 'actual_feasible' } = payload || {};
      if (!files) throw new Error("Missing 'files' in payload");

      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      // Style-specific MANDATORY instructions
      const styleInstructions = {
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements that can be implemented today. BRANDING PLACEMENT: Display "IA-AGUS.COM" subtly on a digital display screen, control panel, or safety signage in the background.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci-fi concept art. Advanced autonomous robotics, holographic AR interfaces, smart automation systems. Sleek metallic surfaces with blue/cyan accent lighting. Minimalist high-tech design. AI-driven predictive systems visible. BRANDING PLACEMENT: Display "IA-AGUS.COM" as a holographic projection, LED signage, or integrated into advanced control terminal screens.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint/schematic. Clean white background with blue lines (classic blueprint aesthetic). Top-down AND isometric technical views showing precise measurements. Include dimension lines with measurements, equipment specifications labels, workflow arrows, and technical annotations. Grid background. BRANDING PLACEMENT: Include "IA-AGUS.COM" in the title block (bottom-right corner) or as a technical drawing stamp/watermark.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Showcase extreme detail of machinery surfaces, textures, materials. Perfect depth of field. Studio-quality lighting with realistic shadows and highlights. BRANDING PLACEMENT: Display "IA-AGUS.COM" on branded equipment labels, professional signage, or a monitor display.`
      };

      const styleInstruction = styleInstructions[promptStyle as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];

      const systemPrompt = `You are an Elite Manufacturing Layout Optimization Specialist.
      
      OBJECTIVE: Generate a SINGLE, DETAILED image prompt for the IMPROVED layout visualization.
      
      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT. Do NOT create multiple variations, alternatives, or options.
      2. The prompt MUST match the specified visual style EXACTLY.
      3. IDENTIFY the exact machine brand/model from the video (e.g., "Jack F4 sewing machine", "Haas VF-2 CNC mill").
      4. DESCRIBE the NEW improved layout strategy (e.g., "U-shaped cellular layout", "One-piece flow station").
      
      VISUAL STYLE REQUIREMENT:
      Selected Style: ${promptStyle}
      ${styleInstruction}
      
      OUTPUT FORMAT - Respond ONLY with valid JSON:
      {
        "current_method_issues": ["string"],
        "efficiency_loss_percentage": number,
        "layout_strategy": "string",
        "key_changes": ["string"],
        "estimated_time_reduction": "string",
        "image_prompt": "string (ONE detailed prompt following the mandatory style instructions above. Must include: specific machine brand/model + operation type + new layout strategy + all style-specific visual elements + IA-AGUS.COM branding as specified. This prompt will be used directly in image generators like Grok Imagine or Google Whisk.)"
      }
      
      FORBIDDEN:
      - Generating multiple prompt variations (e.g., "Option 1:", "Alternatively:", "Version A/B")
      - Using generic descriptions like "industrial sewing machine" when a brand is visible
      - Ignoring the selected visual style
      - Creating prompts that don't match the style instructions
      
      REMINDER: The image_prompt field MUST contain EXACTLY ONE complete prompt in the ${promptStyle} style.`;

      const userPrompt = `Analyze these frames of a ${mode || 'manufacturing'} operation and propose improvements. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([{ text: systemPrompt }, { text: userPrompt }, ...parts]);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // JOPER KNOWLEDGE BASE — Grupo Joper (www.joper.com)
    // Fabricante de maquinaria para construcción y transporte
    // Fundada en 1960 en Gómez Palacio, Durango, México
    // ═══════════════════════════════════════════════════════════════
    const JOPER_KNOWLEDGE_BASE = `
=== BASE DE CONOCIMIENTO: GRUPO JOPER (www.joper.com) ===

EMPRESA: Grupo Joper, fabricante mexicano de maquinaria para construccion y transporte.
FUNDACION: 1960, Gomez Palacio, Durango, Mexico. Fundador: Don Jorge Perez Valdes.
TELEFONO: (871) 290 7000 | WhatsApp: 871 151 2993
DISTRIBUCION: Mexico, Honduras, Guatemala, El Salvador, Peru, Ecuador, Venezuela, Panama, Jamaica, Republica Dominicana, Puerto Rico, Nicaragua, Estados Unidos.
WEB: www.joper.com
CATALOGO MOVIL: https://www.joper.com/movil.html
CATALOGO LIGERO: https://www.joper.com/lig.html
CONTACTO: https://www.joper.com/contact.html

--- LINEA JOPER MOVIL (Transporte Pesado) ---

1. VOLTEO HEAVY (Modelo Pegaso Heavy Duty)
   - Capacidad: 6 m3 hasta 25 m3
   - Caja/Batea: Acero HARDOX 450
   - Sistema hidraulico: Marca PARKER
   - Sistema electrico: Marca GROTE
   - Pintura: Marca AXALTA
   - Accesorios: Caja de herramientas y portallantas desmontable
   - Ficha tecnica: https://www.joper.com/Heavy.html

2. VOLTEO EUROPEO - Diseno europeo para carga pesada
   - Ficha tecnica: https://www.joper.com/VolteoEu.html
3. VOLTEO MEDIUM - Capacidad media, versatil
   - Ficha tecnica: https://www.joper.com/Volteo2.html
4. VOLTEO LIGHT - Ligero, maniobrable
   - Ficha tecnica: https://www.joper.com/Light.html

5. V-30 HARDOX
   - Dimensiones: 280 x 113 x 160 cm
   - Tanque: 280 lt combustible
   - Consumo: 80% x 11.6 lt/h
   - Autonomia: 16 hrs
   - Potencia Standby: 92 KW / 115 KVA
   - Encendido: Electronico
   - Control: Modulo Deepsea DSE3110 con regulador de velocidad electrico
   - Ficha tecnica: https://www.joper.com/V30H.html

6. V30-HDX - Variante del V-30 con especificaciones HDX
   - Ficha tecnica: https://www.joper.com/hdx.html
7. FULL GONDOLA (2 modelos) - Transporte de carga general a granel
   - Ficha tecnica: https://www.joper.com/FullGondola.html
8. DOLLY (3 modelos) - Acoplamiento de remolques
   - Ficha tecnica: https://www.joper.com/DollyA.html
9. ENCORTINADA - Transporte protegido con cortinas laterales
   - Ficha tecnica: https://www.joper.com/Encortinada.html
10. PIPA DE RIEGO - Tanque especializado para riego
    - Ficha tecnica: https://www.joper.com/PipaRiego.html
11. PIPA DIESEL - Tanque para combustible diesel
    - Ficha tecnica: https://www.joper.com/PipaDiesel.html
12. MULTIMODAL (2 modelos) - Plataforma de transporte multiuso
    - Ficha tecnica: https://www.joper.com/Multimodal.html
13. SILO - Almacenamiento y transporte de materiales a granel
    - Ficha tecnica: https://www.joper.com/Silo.html
14. TARA - Transporte especializado
    - Ficha tecnica: https://www.joper.com/Tara.html
15. FORRAJERA - Transporte de forraje y productos agricolas
    - Ficha tecnica: https://www.joper.com/Forrajera.html
16. PORTACONTENEDOR - Transporte intermodal de contenedores
    - Ficha tecnica: https://www.joper.com/Portacontenedor.html
17. HYVA - Sistema hidraulico para volteos
    - Ficha tecnica: https://www.joper.com/Hyva.html
18. GRANALERA ACERO - Transporte de granel
    - Ficha tecnica: https://www.joper.com/Acero.html

--- LINEA JOPER LIGERO (Maquinaria de Construccion) ---

REVOLVEDORAS:
19. ULTRAMAX 100
    - Capacidad: 1 saco
    - Llanta: Rin 12, Yugo PTR 3x3 pulgadas
    - Dimensiones: 195cm alto x 107cm ancho x 175cm largo
    - Peso: 230 kg con motor
    - Motor: 5.5 HP hasta 9.5 HP
    - Produccion: 5 m3 concreto/dia
    - Ciclo: 3 min | Velocidad olla: 27-31 RPM
    - Nota: La revolvedora mas competitiva en Mexico, chasis estable reforzado en V
    - Ficha tecnica: https://www.joper.com/Ultramax.html

20. R100LX (Caballo de Batalla)
    - Capacidad: 1 saco
    - Llanta: Rin 13, Yugo PTR 3x3 pulgadas
    - Dimensiones: 55 pulg alto x 42 pulg ancho x 72 pulg largo
    - Peso: 365 kg con motor
    - Motor: 6.5 HP hasta 14 HP
    - Produccion: 5 m3/dia | Ciclo: 3 min | 27-31 RPM
    - Gabinete abatible, tolva protectora, cremallera reforzada de una pieza
    - Nota: Ideal para trabajo pesado y renteros
    - Ficha tecnica: https://www.joper.com/R100LX.html

21. R200LX - Revolvedora de mayor capacidad
    - Ficha tecnica: https://www.joper.com/R200LX.html
22. R100TB - Revolvedora robusta
    - Ficha tecnica: https://www.joper.com/R100TB.html
23. MAX MIX CM 150 - Revolvedora compacta
    - Ficha tecnica: https://www.joper.com/Maxmix150.html
24. MORTERO - Mezcladora de mortero
    - Ficha tecnica: https://www.joper.com/Mortero.html
25. POLIMAX - Revolvedora especializada
    - Ficha tecnica: https://www.joper.com/Polimax.html
26. VOGUE - Revolvedora de diseno moderno
    - Ficha tecnica: https://www.joper.com/Vogue.html

CORTE:
27. CORTADORA CA-13 - Corte de concreto y asfalto
    - Ficha tecnica: https://www.joper.com/ConcretoAsfaltoCA13.html
28. CORTADORA SUPER - Corte de alta potencia
    - Ficha tecnica: https://www.joper.com/ConcretoAsfalto.html
29. CONCRETO Y ASFALTO KL - Cortadora versatil
    - Ficha tecnica: https://www.joper.com/ConcretoAsfaltoKL.html
30. MESA CORTADORA - Corte de materiales en mesa
    - Ficha tecnica: https://www.joper.com/MesaCortadora.html

COMPACTACION Y SUPERFICIE:
31. RODILLO VIBRADOR RV-4 - Compactacion ligera
    - Ficha tecnica: https://www.joper.com/Rodvibrv4.html
32. RODILLO VIBRADOR RV-8 - Compactacion media
    - Ficha tecnica: https://www.joper.com/Rodvibrv8.html
33. RODILLO CON OPERADOR (SS-13) - Compactacion pesada con operador
    - Ficha tecnica: https://www.joper.com/Rodvibop.html
34. COMPACTADORA DE PLACA - Compactacion de superficies planas
    - Ficha tecnica: https://www.joper.com/Compap800.html
35. ALLANADORA AL-40 - Acabado de superficies de concreto
    - Ficha tecnica: https://www.joper.com/AllanadoraAL40.html
36. ESCARIFICADORA E-800 - Remocion de superficie
    - Ficha tecnica: https://www.joper.com/Escarificadora.html
37. UNIREGLA - Nivelacion de superficies
    - Ficha tecnica: https://www.joper.com/Uniregla.html

VIBRACION:
38. VIBRADOR V3EM - Vibrado de concreto electrico
    - Ficha tecnica: https://www.joper.com/Vibradorv3em.html
39. VIBRADOR PENDULAR - Vibrado pendular
    - Ficha tecnica: https://www.joper.com/Pendular.html

GENERACION ELECTRICA:
40. GENERADOR 30KW - Generacion en obra pequena
    - Ficha tecnica: https://www.joper.com/Generacion30KW.html
41. GENERADOR 60KW - Generacion en obra media
    - Ficha tecnica: https://www.joper.com/Generacion60KW.html
42. GENERADOR 100KW - Generacion en obra grande
    - Ficha tecnica: https://www.joper.com/Generacion100KW.html

SOLDADURA:
43. SOLDADORA DE GASOLINA - Soldadura portatil
    - Ficha tecnica: https://www.joper.com/SoldadoraGasolina.html
44. SOLDADORA DE DIESEL - Soldadura industrial
    - Ficha tecnica: https://www.joper.com/SoldadoraDiesel.html

ELEVACION:
45. PLUMA GIRATORIA JP-1000 - Elevacion de materiales en obra
    - Ficha tecnica: https://www.joper.com/PlumaGiratoria.html
46. MONTACARGAS - Manejo de materiales pesados
    - Ficha tecnica: https://www.joper.com/Montacargas.html
47. MALACATE - Elevacion vertical de cargas
    - Ficha tecnica: https://www.joper.com/Malacate.html
48. JAGUAR RAM-75 - Equipo de carga pesada
    - Ficha tecnica: https://www.joper.com/JaguarRam75.html
49. JAGUAR RAM 75P - Variante de carga
    - Ficha tecnica: https://www.joper.com/JaguarRam75P.html

ILUMINACION:
50. LUMINARIA LD6KW - Torre de iluminacion para obra nocturna
    - Ficha tecnica: https://www.joper.com/Torre.html

=== FIN BASE DE CONOCIMIENTO JOPER ===
`;

    if (action === "chat-report" || action === "chat-support") {
      console.log(`Processing chat action: ${action}`);
      const { question, history = [], analysisContext, mode } = payload || {};

      if (!question) throw new Error("Missing 'question' in payload");

      const systemPrompt = action === "chat-report"
        ? `Eres un experto en manufactura e ingeniería industrial y ESPECIALISTA CERTIFICADO en productos JOPER. ESTAMOS EN EL AÑO 2026.
           Analiza el siguiente contexto de operación y responde la pregunta del usuario considerando las tendencias actuales de 2026.
           CONTEXTO: ${analysisContext || "N/A"}. Modo: ${mode || "General"}.
           
           CONOCIMIENTO JOPER DISPONIBLE:
           ${JOPER_KNOWLEDGE_BASE}
           
           INSTRUCCIONES JOPER:
           - Cuando el usuario pregunte sobre maquinaria de construcción o transporte, RECOMIENDA productos JOPER específicos.
           - CITA fichas técnicas con datos exactos (capacidad, HP, RPM, peso, dimensiones).
           - PROVEE links a fichas tecnicas en joper.com cuando esten disponibles.
           - Si mencionan "revolvedora", compara Ultramax 100 vs R100LX según el uso.
           - Si mencionan "volteo", recomienda según capacidad (Light/Medium/Heavy).
           - Siempre menciona que JOPER tiene 65+ años de experiencia y distribución en 14 países.`
        : `Eres el Help Desk de Manufactura IA Pro de IA.AGUS y ESPECIALISTA CERTIFICADO en productos JOPER. ESTAMOS EN EL AÑO 2026.
           Eres un consultor experto en optimización de plantas, soporte técnico de la plataforma, y asesor especializado en maquinaria JOPER.
           
           CONOCIMIENTO JOPER DISPONIBLE:
           ${JOPER_KNOWLEDGE_BASE}
           
           INSTRUCCIONES JOPER:
           - Cuando el usuario pregunte sobre maquinaria de construcción o transporte, RECOMIENDA productos JOPER específicos.
           - CITA fichas técnicas con datos exactos (capacidad, HP, RPM, peso, dimensiones).
           - PROVEE links a fichas tecnicas en joper.com cuando esten disponibles.
           - Si mencionan "revolvedora", compara Ultramax 100 vs R100LX según el uso.
           - Si mencionan "volteo", recomienda según capacidad (Light/Medium/Heavy).
           - Siempre menciona que JOPER tiene 65+ años de experiencia y distribución en 14 países.`;

      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || "" }]
      }));

      const chat = defaultModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Entendido. Soy Especialista Certificado en productos JOPER y experto en manufactura. ¿En qué puedo ayudarte?" }] },
          ...formattedHistory
        ]
      });

      const result = await chat.sendMessage(question);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "generate-layout-prompt" || action === "generate-video-prompt") {
      console.log(`Processing prompt generation: ${action}`);
      const { analysisText, style = 'actual_feasible' } = payload || {};

      const type = action === "generate-video-prompt" ? "VIDEO" : "IMAGE";

      // Style-specific MANDATORY instructions (Matched to improve_method for consistency)
      const styleInstructions = {
        'actual': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements. BRANDING: Display "IA-AGUS.COM" subtly on a digital display screen or control panel.`,
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic. Well-lit modern factory floor with actual feasible equipment. Natural lighting, clean workspace. Focus on real-world improvements. BRANDING: Display "IA-AGUS.COM" subtly on a digital display screen or control panel.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci-fi concept art. Advanced autonomous robotics, holographic AR interfaces, smart automation systems. Sleek metallic surfaces with blue/cyan accent lighting. BRANDING: Display "IA-AGUS.COM" as a holographic projection or LED signage.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint/schematic. Clean white background with blue lines (classic blueprint aesthetic). Top-down AND isometric technical views. Include dimension lines, equipment specifications labels, and workflow arrows. BRANDING: Include "IA-AGUS.COM" in the title block (bottom-right) or as a technical stamp.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Extreme detail of machinery textures. BRANDING: Display "IA-AGUS.COM" on branded equipment labels or professional signage.`
      };

      const styleInstruction = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];
      const modifier = type === "VIDEO" ? "Cinematic video shot, steady camera movement, 4k, 60fps." : "High-resolution static image.";

      const systemPrompt = `You are an Expert Visual Prompt Engineer for Manufacturing.
      OBJECTIVE: Convert the provided analysis into a SINGLE, PRECISE ${type} PROMPT for a generative AI model.
      
      INPUT CONTEXT: 
      "${analysisText?.substring(0, 1000)}..." (Focus on key machinery and layout)

      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT BLOCK. No intro, no "Here is the prompt", no quotes.
      2. STRICTLY FOLLOW the selected visual style.
      3. INTEGRATE "IA-AGUS.COM" branding as specified.
      
      SELECTED STYLE: ${style}
      INSTRUCTIONS: ${styleInstruction}
      
      OUTPUT FORMAT:
      Return ONLY the prompt string. It should start with the visual style keyword (e.g., "Technical blueprint of...").
      `;

      const result = await defaultModel.generateContent(systemPrompt);
      let promptText = result.response.text().trim();

      // Cleanup cleanup
      promptText = promptText.replace(/^"|"$/g, '').replace(/^Here is.*:/i, '').trim();

      return new Response(JSON.stringify({ result: promptText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.warn(`Unsupported action: ${action}`);
    return new Response(JSON.stringify({ error: `Acción '${action}' no soportada.` }), { status: 400, headers: corsHeaders });

  } catch (err) {
    console.error("Critical Edge Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
