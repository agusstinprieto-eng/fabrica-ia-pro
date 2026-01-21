import { GoogleGenerativeAI } from '@google/generative-ai';
import { MaintenancePrediction, Machine } from '../types/maintenance';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const analyzeMaintenanceNeeds = async (machine: Machine): Promise<MaintenancePrediction> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Eres un experto en mantenimiento predictivo industrial. Analiza esta máquina y proporciona recomendaciones:

DATOS DE LA MÁQUINA:
- Nombre: ${machine.name}
- Tipo: ${machine.type}
- Health Score Actual: ${machine.healthScore}/100
- Horas de Operación: ${machine.totalOperatingHours}
- Ciclos Completados: ${machine.cyclesCompleted}
- Eficiencia Actual: ${machine.currentEfficiency}%
- Probabilidad de Falla: ${machine.failureProbability}%
- Última Inspección: ${machine.lastInspection}
- Próximo Mantenimiento: ${machine.nextMaintenanceDue}

HISTORIAL DE MANTENIMIENTO:
${machine.maintenanceHistory.map(m => `- ${m.date}: ${m.description} (${m.type})`).join('\n')}

HISTORIAL DE FALLAS:
${machine.failureHistory.length > 0
            ? machine.failureHistory.map(f => `- ${f.date}: ${f.component} - ${f.description}`).join('\n')
            : 'Sin fallas registradas'}

COMPONENTES EN RIESGO:
${machine.componentsAtRisk.length > 0
            ? machine.componentsAtRisk.map(c => `- ${c.name}: ${c.riskPercentage}% riesgo`).join('\n')
            : 'Ninguno'}

Proporciona tu análisis en formato JSON con esta estructura exacta:
{
  "healthScore": <número 0-100>,
  "riskLevel": "<low|medium|high|critical>",
  "componentsAtRisk": [
    {
      "name": "<nombre del componente>",
      "riskPercentage": <número>,
      "estimatedFailureDate": "<YYYY-MM-DD>",
      "recommendedAction": "<acción recomendada>"
    }
  ],
  "recommendations": [
    "<recomendación 1>",
    "<recomendación 2>",
    "<recomendación 3>"
  ],
  "spareParts": [
    "<pieza 1>",
    "<pieza 2>"
  ],
  "estimatedCost": <número en USD>,
  "urgency": "<immediate|week|month|quarter>"
}

Sé específico y técnico. Usa datos reales de la industria.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const prediction: MaintenancePrediction = JSON.parse(jsonMatch[0]);
        return prediction;
    } catch (error) {
        console.error('Error analyzing machine:', error);
        // Return fallback prediction
        return {
            healthScore: machine.healthScore,
            riskLevel: machine.riskLevel,
            componentsAtRisk: machine.componentsAtRisk,
            recommendations: [
                'Realizar inspección visual completa',
                'Verificar niveles de lubricación',
                'Revisar componentes críticos'
            ],
            spareParts: ['Filtros', 'Lubricante'],
            estimatedCost: 500,
            urgency: 'month'
        };
    }
};

export const generateMaintenanceReport = async (machine: Machine, prediction: MaintenancePrediction): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Genera un reporte ejecutivo de mantenimiento para esta máquina:

MÁQUINA: ${machine.name} (${machine.type})
HEALTH SCORE: ${prediction.healthScore}/100
NIVEL DE RIESGO: ${prediction.riskLevel}

COMPONENTES EN RIESGO:
${prediction.componentsAtRisk.map(c => `- ${c.name}: ${c.riskPercentage}%`).join('\n')}

RECOMENDACIONES:
${prediction.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Genera un reporte profesional en español de máximo 300 palabras que incluya:
1. Resumen ejecutivo del estado
2. Acciones inmediatas requeridas
3. Plan de mantenimiento sugerido
4. Impacto en producción si no se actúa

Usa un tono profesional pero accesible.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Error generating report:', error);
        return `Reporte de Mantenimiento - ${machine.name}\n\nEstado: ${prediction.riskLevel}\nAcciones requeridas: ${prediction.recommendations.join(', ')}`;
    }
};
