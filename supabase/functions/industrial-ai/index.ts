import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "npm:@supabase/supabase-js";

// Supabase client for knowledge base lookups
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

/** Fetch company knowledge from the DB and format it for AI */
async function getCompanyKnowledge(company: string): Promise<string> {
  if (!company) return '';
  try {
    const { data, error } = await supabaseClient
      .from('company_knowledge_base')
      .select('category, title, content, metadata')
      .eq('company', company)
      .order('category')
      .order('title');
    if (error || !data || data.length === 0) return '';
    // Group by category
    const grouped: Record<string, typeof data> = {};
    for (const entry of data) {
      if (!grouped[entry.category]) grouped[entry.category] = [];
      grouped[entry.category].push(entry);
    }
    let output = `=== BASE DE CONOCIMIENTO: ${company} ===\n\n`;
    for (const [category, items] of Object.entries(grouped)) {
      output += `--- ${category.toUpperCase().replace(/_/g, ' ')} ---\n`;
      for (const item of items) {
        output += `• ${item.title}: ${item.content}`;
        if (item.metadata?.ficha_tecnica) output += ` | Ficha técnica: ${item.metadata.ficha_tecnica}`;
        output += '\n';
      }
      output += '\n';
    }
    output += `=== FIN BASE DE CONOCIMIENTO ${company} ===`;
    return output;
  } catch (err) {
    console.error('Error fetching knowledge:', err);
    return '';
  }
}

/** Generate Embedding using Gemini */
async function generateEmbedding(text: string, genAI: GoogleGenerativeAI): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

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
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.0, // CRITICAL: No creativity for time measurement
        topP: 1.0,  // Maximum determinism
        topK: 1     // Only consider top choice
      }
    });

    if (action === "analyze") {
      console.log("Processing 'analyze' action...");
      const { files, mode, lang, videoMetadata } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing or invalid 'files' in payload");

      const parts = [];

      // OPTION 6: Native Video API (Highest Precision)
      if (videoMetadata && payload.videoData) {
        console.log("Using Native Video API for analysis...");
        parts.push({
          inlineData: {
            mimeType: payload.videoData.mimeType,
            data: payload.videoData.base64
          }
        });
      } else {
        // Fallback: Frame Sequence (V1)
        console.log("Using Frame Sequence fallback...");
        parts.push(...files.map((f: any) => ({
          inlineData: { mimeType: f.mimeType, data: f.base64 }
        })));
      }

      const systemPrompt = `You are a DETERMINISTIC INDUSTRIAL ENGINEER (MTM-1 Certified).
      OBJECTIVE: Analyze the provided video/frames and return a PRECISE TIME STUDY in JSON.
      
      PHASE 1 - MOTION IDENTIFICATION (THERBLIGS):
      Scan the video for micro-movements (Reach, Grasp, Move, Position, Release, Assemble, Disassemble, Inspect, Release, Transport, Wait).
      - PRECISE TIMING: Start and end times must be accurate to within 0.1s based on visual cues.
      - TMU: 1 TMU = 0.036 seconds. Use this for MTM-1 validation.

      PHASE 2 - TEMPORAL CONSISTENCY:
      - Elements must be SEQUENTIAL. The "end_time" of element N must match the "start_time" of element N+1.
      - Total sum of "time_seconds" in cycle_analysis MUST EXACTLY EQUAL time_calculation.observed_time.
      
      JSON SCHEMA (Strict):
      {
        "operation_name": "string",
        "technical_specs": { "machine": "string", "material": "string" },
        "mtm_analysis": { "total_tmu": number, "codes": [{ "code": "string", "tmu": number, "description": "string" }] },
        "cycle_analysis": [{ "element": "string", "time_seconds": number, "start_time": number, "end_time": number, "value_added": boolean, "therblig": "string" }],
        "time_calculation": { "observed_time": number, "rating_factor": number, "allowances_pfd": number, "standard_time": number, "units_per_hour": number },
        "quality_audit": { "risk_level": "string", "potential_defects": ["string"] },
        "ergo_vitals": { "overall_risk_score": number, "critical_body_part": "string", "recommendation": "string" },
        "waste_analysis": { "waste_type": "string", "sustainability_score": number },
        "lean_metrics": { "five_s_audit": { "overall": number }, "kaizen_blitz_goals": ["string"] },
        "safety_audit": { "safety_score": number, "ppe_detected": ["string"], "ppe_missing": ["string"] },
        "improvements": [ { "issue": "string", "recommendation": "string", "impact": "string" } ], 
        "summary_text": "string (CONCISE)",
        "image_prompt": "string"
      }
      
      STRICT RULES:
      1. ALL TIMES IN DECIMAL SECONDS (e.g. 15.4). 
      2. Analyze ONLY the FIRST COMPLETE CYCLE. Identify the exact moment when the operator starts the task and when it is disposed.
      3. Language: ${lang || 'es'}.
      4. NO HALLUCINATIONS: If a movement is not clearly visible, mark it as 'unclear' but estimate based on standard workflow.
      5. MATH CHECK: Return the JSON only if (sum of element times) == observed_time. If there is a gap, add an element named "Process Slack" to account for it.`;

      // Build video metadata context for temporal accuracy
      let metadataContext = '';
      if (videoMetadata) {
        metadataContext = `VIDEO METADATA: Total Duration = ${videoMetadata.duration} s.
        If you are analyzing a RAW VIDEO FILE: The model sees the whole video.Map your element start / end times precisely to the video timeline.
        If you are analyzing FRAMES: Use these timestamps[${videoMetadata.timestamps?.join(', ')}]s.
        The total cycle time CANNOT exceed ${videoMetadata.duration} s.`;
      }

      const userPrompt = `Analyze this operation of ${mode || 'manufacturing'}. ${metadataContext} Return ONLY the JSON.`;

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
        'actual_feasible': `MANDATORY STYLE: Professional industrial photography - photorealistic.Well - lit modern factory floor with actual feasible equipment.Natural lighting, clean workspace.Focus on real - world improvements that can be implemented today.LAYOUT: Show a clear perspective of the station including bins(contenedores), disposal areas(area de dispose), and operator workspace.BRANDING PLACEMENT: Display "IA-AGUS.COM" subtly on a digital display screen, control panel, or safety signage in the background.`,

        'futuristic': `MANDATORY STYLE: Futuristic sci - fi concept art.Advanced autonomous robotics, holographic AR interfaces, smart automation systems.Sleek metallic surfaces with blue / cyan accent lighting.Minimalist high - tech design.AI - driven predictive systems visible.LAYOUT: Advanced spatial arrangement with optimized material flow visible.BRANDING PLACEMENT: Display "IA-AGUS.COM" as a holographic projection, LED signage, or integrated into advanced control terminal screens.`,

        'blueprint': `MANDATORY STYLE: Technical engineering blueprint / schematic.Clean white background with blue lines(classic blueprint aesthetic).PRIMARY PERSPECTIVE: BIRD'S-EYE VIEW (VISTA DESDE ARRIBA / SUPERIOR) for layout optimization. Include top-down AND isometric technical views showing precise measurements. DRAW: Position of bins (contenedores), disposal zones (dispose), operator footprint, material flow arrows, and technical annotations. Grid background. BRANDING PLACEMENT: Include "IA-AGUS.COM" in the title block (bottom-right corner) or as a technical drawing stamp/watermark.`,

        'hyper-realistic': `MANDATORY STYLE: Cinematic ultra-high-resolution photorealism. Professional cinematography with dramatic three-point lighting. Showcase extreme detail of machinery surfaces, textures, materials. Perfect depth of field. STUDIO LIGHTING: Clear visibility of workstation layout, containers, and operator positioning. BRANDING PLACEMENT: Display "IA-AGUS.COM" on branded equipment labels, professional signage, or a monitor display.`
      };

      const styleInstruction = styleInstructions[promptStyle as keyof typeof styleInstructions] || styleInstructions['actual_feasible'];

      const systemPrompt = `You are an Elite Manufacturing Layout Optimization Specialist with MASTERCLASS expertise in Lean Engineering and Motion Economy.
      
      OBJECTIVE: Analyze the provided images to IDENTIFY the specific operation and machine, then generate a SINGLE, DETAILED image prompt for an IMPROVED layout visualization.
      
      CRITICAL ANALYSIS STEPS:
      1. IDENTIFY THE CURRENT STATE:
         - What specific machine is being used? (Detect brand/model if visible, e.g., "Juki DDL-8700", "Haas VF-2", "Brother S-7200").
         - What is the specific operation? (e.g., "Hemming piping", "PCB Soldering", "Metal Deburring").
         - What are the current inefficiencies? (Excess motion, poor material placement, awkward ergonomics).

      2. GENERATE IMPROVEMENT STRATEGY:
         - Propose a layout that keeps the SAME core operation but optimizes it.
         - SUGGEST FEASIBLE AUTOMATION relevant to THIS specific machine (e.g., if sewing, add automatic thread trimmers or specific guides; if assembly, add gravity feed bins).
         - OPTIMIZE MATERIAL FLOW: Ensure input and output are ergonomically positioned.

      CRITICAL RULES:
      1. GENERATE ONLY ONE (1) PROMPT. Do NOT create multiple variations, alternatives, or options.
      2. The prompt MUST match the specified visual style EXACTLY.
      3. **DYNAMIC REALISM**: The improved machine MUST correspond to the type of operation observed. Do NOT suggest a sewing machine if the video shows welding. Do NOT suggest a stacker if the operation requires manual hanging.
      4. LAYOUT ELEMENTS: Explicitly describe the placement of input bins (contenedores), disposal areas (dispose zones), the operator's standing/sitting position, and the directional flow of materials.
      5. PERSPECTIVE: If the style is "blueprint", the perspective MUST be Top-Down (Bird's-eye view). For other styles, ensure the station layout is clearly visible.
      
      VISUAL STYLE REQUIREMENT:
      Selected Style: ${promptStyle}
      ${styleInstruction}
      
      OUTPUT FORMAT - Respond ONLY with valid JSON:
      {
        "method_improvement": {
          "current_method_issues": ["string"],
          "efficiency_loss_percentage": number,
          "layout_strategy": "string",
          "centralization_recommendation": "string (optional: only if relevant to the observed workflow)",
          "automation_suggestion": "string (suggest specific upgrades RELEVANT to the detected machine)",
          "key_changes": ["string"],
          "estimated_time_reduction": "string",
          "image_prompt": "string (ONE detailed prompt following the mandatory style instructions above. Must include: The SPECIFIC improved machine (based on what was detected) + optimized layout + input bins + operator position + material flow arrows + IA-AGUS.COM branding.)"
        }
      }
      
      FORBIDDEN:
      - Generating multiple prompt variations (e.g., "Option 1:", "Alternatively:")
      - Hallucinating machines unrelated to the video input (e.g., suggesting a wood lathe for a sewing operation).
      - Applying generic "one-size-fits-all" solutions that don't fit the observed workflow.
      - Ignoring the selected visual style.
      
      REMINDER: The image_prompt field MUST contain EXACTLY ONE complete prompt in the ${promptStyle} style.`;

      const userPrompt = `Analyze these frames of a ${mode || 'manufacturing'} operation and propose improvements. Return ONLY the JSON.`;

      const result = await defaultModel.generateContent([{ text: systemPrompt }, { text: userPrompt }, ...parts]);
      return new Response(JSON.stringify({ result: result.response.text() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // DYNAMIC COMPANY KNOWLEDGE BASE — fetched from Supabase DB
    // Each company's catalog is stored in company_knowledge_base table
    // ═══════════════════════════════════════════════════════════════

    if (action === "chat-report" || action === "chat-support") {
      console.log(`Processing chat action: ${action}`);
      const { question, history = [], analysisContext, mode, company } = payload || {};

      if (!question) throw new Error("Missing 'question' in payload");

      // Fetch company knowledge dynamically from DB
      const COMPANY_KNOWLEDGE = await getCompanyKnowledge(company || '');
      const hasKnowledge = COMPANY_KNOWLEDGE.length > 0;
      const knowledgeBlock = hasKnowledge ? `\nCONOCIMIENTO DE EMPRESA DISPONIBLE:\n${COMPANY_KNOWLEDGE}` : '';
      const knowledgeInstructions = hasKnowledge ? `
           INSTRUCCIONES DE PRODUCTOS:
           - Cuando el usuario pregunte sobre maquinaria o productos, RECOMIENDA productos específicos de la base de conocimiento.
           - CITA fichas técnicas con datos exactos (capacidad, HP, RPM, peso, dimensiones).
           - PROVEE links a fichas técnicas cuando estén disponibles.
           - Siempre menciona la experiencia y distribución de la empresa.` : '';

      const systemPrompt = action === "chat-report"
        ? `Eres un experto en manufactura e ingeniería industrial${hasKnowledge ? ` y ESPECIALISTA CERTIFICADO en productos de ${company}` : ''}. ESTAMOS EN EL AÑO 2026.
           Analiza el siguiente contexto de operación y responde la pregunta del usuario considerando las tendencias actuales de 2026.
           CONTEXTO: ${analysisContext || "N/A"}. Modo: ${mode || "General"}.
           ${knowledgeBlock}
           ${knowledgeInstructions}`
        : `Eres el Help Desk de Manufactura IA Pro de IA.AGUS${hasKnowledge ? ` y ESPECIALISTA CERTIFICADO en productos de ${company}` : ''}. ESTAMOS EN EL AÑO 2026.
           Eres un consultor experto en optimización de plantas, soporte técnico de la plataforma${hasKnowledge ? `, y asesor especializado en productos de ${company}` : ''}.
           
           DETALLE DE PRODUCTO CORE (2026):
           - FACTORY FLOOR PLAN: Inversión de $2,499 USD / mes (Contrato Anual).
           - INCLUYE: 500 Estudios de Ingeniería / Mes, 5 Usuarios Admin + Viewers Ilimitados, Soporte Prioritario 24/7.
           - IMPACTO: +22% Eficiencia General y Payback en < 1 Mes.
           
           ${knowledgeBlock}
           ${knowledgeInstructions}`;

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

    if (action === "classify_segments") {
      console.log("Processing 'classify_segments' action...");
      const { files, mode, lang } = payload || {};
      if (!files || !Array.isArray(files)) throw new Error("Missing 'files' in payload");

      // We expect 1 image per segment
      const parts = files.map((f: any) => ({
        inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));

      const systemPrompt = `You are an Industrial Engineering Classifier.
      OBJECTIVE: Identify the industrial motion (Therblig) happening in each image provided.
      CONTEXT: These images represent sequential steps in a ${mode || 'manufacturing'} operation.
      
      OUTPUT FORMAT: A JSON array of strings, one for each image.
      Example: ["Reach for fabric", "Position under foot", "Sewing cycle", "Dispose"]
      
      RULES:
      1. Use standard industrial terms (Reach, Grasp, Move, Position, Assemble, Disassemble, Release, Inspect).
      2. Be concise (max 3-4 words per label).
      3. Language: ${lang || 'es'}.
      4. Return ONLY the JSON array.`;

      const userPrompt = `Classify these ${files.length} images in order.`;

      const result = await defaultModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
        ...parts
      ]);

      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      return new Response(JSON.stringify({ result: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "index-document") {
      console.log("Processing 'index-document' action...");
      const { filePath, fileName, companyId, mimeType } = payload || {};

      // 1. Download file from Storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('documents')
        .download(filePath);

      if (downloadError) throw new Error(`Download Error: ${downloadError.message}`);

      // 2. Extract Text (Simplified for demo: assuming text/plain or basic parsing)
      // In production, use Tika or a dedicated PDF parser service. 
      // For now, we'll assume it's text-extractable or use a placeholder if binary.
      let textContent = "";
      if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('csv')) {
        textContent = await fileData.text();
      } else {
        // Fallback or placeholder for PDF/Images if no parser available in Deno Edge
        // Ideally, call an external OCR/Parser API here.
        textContent = `Document: ${fileName}. Content extraction requires dedicated parser. Metadata: ${mimeType}`;
      }

      // 3. Chunk Text
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < textContent.length; i += chunkSize) {
        chunks.push(textContent.slice(i, i + chunkSize));
      }

      // 4. Register Document
      const { data: doc, error: docError } = await supabaseClient
        .from('documents')
        .insert({
          company_id: companyId,
          name: fileName,
          url: filePath,
          type: mimeType
        })
        .select()
        .single();

      if (docError) throw new Error(`DB Insert Error: ${docError.message}`);

      // 5. Generate & Store Embeddings
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

      for (const chunk of chunks) {
        const result = await embeddingModel.embedContent(chunk);
        const embedding = result.embedding.values;

        await supabaseClient.from('document_embeddings').insert({
          document_id: doc.id,
          content: chunk,
          embedding
        });
      }

      return new Response(JSON.stringify({ result: "Indexed successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "chat-knowledge") {
      console.log("Processing 'chat-knowledge' action...");
      const { question, history, companyId } = payload || {};

      // 1. Embed Question
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await embeddingModel.embedContent(question);
      const embedding = result.embedding.values;

      // 2. Search Vectors (RPC call to match_documents)
      const { data: chunks, error: searchError } = await supabaseClient.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
        filter_company_id: companyId
      });

      if (searchError) throw new Error(`Vector Search Error: ${searchError.message}`);

      // 3. Synthesize Answer
      const context = chunks.map((c: any) => c.content).join('\n---\n');
      const systemPrompt = `You are a Knowledge Assistant for ${companyId}. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.
        
        CONTEXT:
        ${context}
        `;

      const chat = defaultModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Understood. I will answer based on the provided documents." }] },
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          }))
        ]
      });

      const ans = await chat.sendMessage(question);
      return new Response(JSON.stringify({ result: ans.response.text() }), {
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
