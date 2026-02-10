/**
 * Knowledge Base Service
 * Fetches company-specific knowledge from Supabase for AI chat/voice.
 */
import { supabase } from './supabase';

interface KnowledgeEntry {
    id: string;
    company: string;
    category: string;
    title: string;
    content: string;
    metadata: Record<string, string>;
}

// In-memory cache: company -> formatted knowledge string
const knowledgeCache: Record<string, { data: string; timestamp: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches and formats the company knowledge base as a single string
 * suitable for AI system instructions. Results are cached for 10 minutes.
 */
export async function getCompanyKnowledge(company: string): Promise<string> {
    if (!company) return '';

    // Check cache
    const cached = knowledgeCache[company];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[KnowledgeService] Cache hit for "${company}"`);
        return cached.data;
    }

    try {
        console.log(`[KnowledgeService] Fetching knowledge for "${company}"...`);
        const { data, error } = await supabase
            .from('company_knowledge_base')
            .select('category, title, content, metadata')
            .eq('company', company)
            .order('category')
            .order('title');

        if (error) {
            console.error('[KnowledgeService] DB Error:', error.message);
            return '';
        }

        if (!data || data.length === 0) {
            console.log(`[KnowledgeService] No knowledge found for "${company}"`);
            return '';
        }

        // Format into a structured text block for AI
        const formatted = formatKnowledgeForAI(company, data as KnowledgeEntry[]);

        // Cache result
        knowledgeCache[company] = { data: formatted, timestamp: Date.now() };
        console.log(`[KnowledgeService] Loaded ${data.length} entries for "${company}"`);

        return formatted;
    } catch (err) {
        console.error('[KnowledgeService] Exception:', err);
        return '';
    }
}

/**
 * Groups knowledge entries by category and formats them
 * into a concise text block for AI system instructions.
 */
function formatKnowledgeForAI(company: string, entries: KnowledgeEntry[]): string {
    // Group by category
    const grouped: Record<string, KnowledgeEntry[]> = {};
    for (const entry of entries) {
        if (!grouped[entry.category]) grouped[entry.category] = [];
        grouped[entry.category].push(entry);
    }

    let output = `=== BASE DE CONOCIMIENTO: ${company} ===\n\n`;

    for (const [category, items] of Object.entries(grouped)) {
        output += `--- ${category.toUpperCase().replace(/_/g, ' ')} ---\n`;
        for (const item of items) {
            output += `• ${item.title}: ${item.content}`;
            // Add ficha_tecnica link if available
            if (item.metadata?.ficha_tecnica) {
                output += ` | Ficha técnica: ${item.metadata.ficha_tecnica}`;
            }
            output += '\n';
        }
        output += '\n';
    }

    output += `=== FIN BASE DE CONOCIMIENTO ${company} ===`;
    return output;
}

/**
 * Clears the knowledge cache (useful on logout or company switch)
 */
export function clearKnowledgeCache(): void {
    Object.keys(knowledgeCache).forEach(key => delete knowledgeCache[key]);
}
