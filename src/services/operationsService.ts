import { supabase } from '../lib/supabaseClient';

export interface ManufacturingOperation {
    id?: string;
    process_code?: string;
    operation: string;
    machine_code?: string;
    tmu?: number;
    smv?: number;
    tgt_hr?: number;
    machine_type?: string;
    machine_full_form?: string;
    brand?: string;
    created_at?: string;
}

export const operationsService = {
    async uploadOperations(data: any[]) {
        // Helper to find key case-insensitive and trimmed
        const findKey = (obj: any, target: string) => {
            const keys = Object.keys(obj);
            const key = keys.find(k => k.trim().toLowerCase() === target.toLowerCase());
            return key ? obj[key] : undefined;
        };

        // Map Excel columns to Database columns
        const formattedData: ManufacturingOperation[] = data.map(item => ({
            process_code: findKey(item, 'PROCESS CODE') || findKey(item, 'process_code'),
            operation: findKey(item, 'OPERATION') || findKey(item, 'operation'),
            machine_code: findKey(item, 'M/C') || findKey(item, 'machine_code'),
            tmu: Number(findKey(item, 'T.M.U.')) || Number(findKey(item, 'tmu')) || 0,
            smv: Number(findKey(item, 'S.M.V.')) || Number(findKey(item, 'smv')) || 0,
            tgt_hr: Number(findKey(item, 'TGT / HR')) || Number(findKey(item, 'tgt_hr')) || 0,
            machine_type: findKey(item, 'Machine Type') || findKey(item, 'machine_type'),
            machine_full_form: findKey(item, 'Machine Full Form') || findKey(item, 'machine_full_form'),
            brand: findKey(item, 'Brand') || findKey(item, 'brand')
        }));

        const { data: insertedData, error } = await supabase
            .from('manufacturing_operations')
            .insert(formattedData)
            .select();

        if (error) {
            console.error('Error uploading operations:', error);
            throw error;
        }

        return insertedData;
    },

    async getOperations() {
        const { data, error } = await supabase
            .from('manufacturing_operations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ManufacturingOperation[];
    },

    async searchOperations(query: string) {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('manufacturing_operations')
            .select('*')
            .ilike('operation', `%${query}%`)
            .limit(20);

        if (error) {
            console.error('Error searching operations:', error);
            return [];
        }
        return data as ManufacturingOperation[];
    },

    async uploadMachineTypes(data: any[]) {
        // Helper to find key case-insensitive and trimmed
        const findKey = (obj: any, target: string) => {
            const keys = Object.keys(obj);
            const key = keys.find(k => k.trim().toLowerCase() === target.toLowerCase());
            return key ? obj[key] : undefined;
        };

        const formattedData = data.map(item => ({
            code: findKey(item, 'Machine Type'),
            name: findKey(item, 'Machine Full Form'),
            brand: findKey(item, 'Brand')
        })).filter(item => item.code); // Filter out empty rows

        const { data: insertedData, error } = await supabase
            .from('manufacturing_machine_types')
            .upsert(formattedData, { onConflict: 'code' }) // Update if exists
            .select();

        if (error) {
            console.error('Error uploading machine types:', error);
            throw error;
        }
        return insertedData;
    }
};
