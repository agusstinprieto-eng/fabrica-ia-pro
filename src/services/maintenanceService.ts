import { MaintenancePrediction, Machine } from '../types/maintenance';
import { supabase } from '../lib/supabaseClient';

export const analyzeMaintenanceNeeds = async (machine: Machine): Promise<MaintenancePrediction> => {
    try {
        const { data, error } = await supabase.functions.invoke('industrial-ai', {
            body: {
                action: 'maintenance',
                payload: {
                    machine,
                    type: 'analysis'
                }
            }
        });

        if (error) throw error;

        const responseText = data.result;

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
    try {
        const { data, error } = await supabase.functions.invoke('industrial-ai', {
            body: {
                action: 'maintenance',
                payload: {
                    machine,
                    prediction,
                    type: 'report'
                }
            }
        });

        if (error) throw error;
        return data.result;
    } catch (error) {
        console.error('Error generating report:', error);
        return `Reporte de Mantenimiento - ${machine.name}\n\nEstado: ${prediction.riskLevel}\nAcciones requeridas: ${prediction.recommendations.join(', ')}`;
    }
};
