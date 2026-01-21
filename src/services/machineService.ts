import { supabase } from '../lib/supabaseClient';
import { Machine } from '../types/maintenance';

export interface MachineInput {
    name: string;
    type: string;
    location: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    installationDate?: string;
    totalOperatingHours?: number;
}

export const machineService = {
    /**
     * Get all machines for the current user
     */
    async getMachines(): Promise<Machine[]> {
        try {
            const { data, error } = await supabase
                .from('machines')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching machines:', error);
                throw error;
            }

            // Transform database format to Machine type
            return (data || []).map(dbMachine => ({
                id: dbMachine.id,
                name: dbMachine.name,
                type: dbMachine.type,
                location: dbMachine.location,
                manufacturer: dbMachine.manufacturer || '',
                model: dbMachine.model || '',
                serialNumber: dbMachine.serial_number || '',
                installationDate: dbMachine.installation_date || '',
                totalOperatingHours: dbMachine.total_operating_hours || 0,
                currentEfficiency: dbMachine.current_efficiency || 100,
                healthScore: dbMachine.health_score || 100,
                riskLevel: dbMachine.risk_level || 'low',
                failureProbability: dbMachine.failure_probability || 0,
                nextMaintenanceDue: dbMachine.next_maintenance_due || '',
                componentsAtRisk: dbMachine.components_at_risk || []
            }));
        } catch (error) {
            console.error('Error in getMachines:', error);
            return []; // Return empty array on error
        }
    },

    /**
     * Add a new machine
     */
    async addMachine(machineInput: MachineInput): Promise<Machine> {
        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error('User not authenticated');
            }

            // Prepare machine data for database
            const machineData = {
                user_id: user.id,
                name: machineInput.name,
                type: machineInput.type,
                location: machineInput.location,
                manufacturer: machineInput.manufacturer || null,
                model: machineInput.model || null,
                serial_number: machineInput.serialNumber || null,
                installation_date: machineInput.installationDate || null,
                total_operating_hours: machineInput.totalOperatingHours || 0,
                current_efficiency: 100,
                health_score: 100,
                risk_level: 'low',
                failure_probability: 0,
                next_maintenance_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                components_at_risk: []
            };

            const { data, error } = await supabase
                .from('machines')
                .insert(machineData)
                .select()
                .single();

            if (error) {
                console.error('Error adding machine:', error);
                throw error;
            }

            // Transform to Machine type
            return {
                id: data.id,
                name: data.name,
                type: data.type,
                location: data.location,
                manufacturer: data.manufacturer || '',
                model: data.model || '',
                serialNumber: data.serial_number || '',
                installationDate: data.installation_date || '',
                totalOperatingHours: data.total_operating_hours || 0,
                currentEfficiency: data.current_efficiency || 100,
                healthScore: data.health_score || 100,
                riskLevel: data.risk_level || 'low',
                failureProbability: data.failure_probability || 0,
                nextMaintenanceDue: data.next_maintenance_due || '',
                componentsAtRisk: data.components_at_risk || []
            };
        } catch (error) {
            console.error('Error in addMachine:', error);
            throw error;
        }
    },

    /**
     * Update an existing machine
     */
    async updateMachine(id: string, updates: Partial<MachineInput>): Promise<Machine> {
        try {
            const updateData: any = {};

            if (updates.name) updateData.name = updates.name;
            if (updates.type) updateData.type = updates.type;
            if (updates.location) updateData.location = updates.location;
            if (updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer;
            if (updates.model !== undefined) updateData.model = updates.model;
            if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber;
            if (updates.installationDate !== undefined) updateData.installation_date = updates.installationDate;
            if (updates.totalOperatingHours !== undefined) updateData.total_operating_hours = updates.totalOperatingHours;

            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('machines')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating machine:', error);
                throw error;
            }

            return {
                id: data.id,
                name: data.name,
                type: data.type,
                location: data.location,
                manufacturer: data.manufacturer || '',
                model: data.model || '',
                serialNumber: data.serial_number || '',
                installationDate: data.installation_date || '',
                totalOperatingHours: data.total_operating_hours || 0,
                currentEfficiency: data.current_efficiency || 100,
                healthScore: data.health_score || 100,
                riskLevel: data.risk_level || 'low',
                failureProbability: data.failure_probability || 0,
                nextMaintenanceDue: data.next_maintenance_due || '',
                componentsAtRisk: data.components_at_risk || []
            };
        } catch (error) {
            console.error('Error in updateMachine:', error);
            throw error;
        }
    },

    /**
     * Delete a machine
     */
    async deleteMachine(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting machine:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error in deleteMachine:', error);
            throw error;
        }
    }
};
