import { IndustrialMode, Operation } from '../types';

// Data structure for different industries
export const INDUSTRIAL_OPERATIONS: Record<IndustrialMode, Record<string, Omit<Operation, 'stationId'>[]>> = {
    automotive: {
        'seat_belt': [
            { id: 'sb-1', name: 'Mount Retractor', code: 'OP-10', time: 12.5, category: 'assembly' },
            { id: 'sb-2', name: 'Attach Webbing', code: 'OP-20', time: 15.2, category: 'assembly' },
            { id: 'sb-3', name: 'Install Tensioner', code: 'OP-30', time: 18.5, category: 'assembly' },
            { id: 'sb-4', name: 'Torque Check', code: 'QC-10', time: 8.5, category: 'inspection' },
            { id: 'sb-5', name: 'Buckle Assembly', code: 'OP-40', time: 14.2, category: 'assembly' },
            { id: 'sb-6', name: 'Final Pull Test', code: 'QC-20', time: 22.0, category: 'testing' },
        ],
        'transmission': [
            { id: 'tr-1', name: 'Case Preparation', code: 'OP-05', time: 25.0, category: 'machining' },
            { id: 'tr-2', name: 'Install Gears', code: 'OP-15', time: 45.5, category: 'assembly' },
            { id: 'tr-3', name: 'Seal Housing', code: 'OP-25', time: 18.2, category: 'assembly' },
            { id: 'tr-4', name: 'Leak Test', code: 'QC-05', time: 30.0, category: 'testing' },
        ],
        'ev_battery': [
            { id: 'ev-1', name: 'Cell Inspection', code: 'EV-10', time: 15.0, category: 'inspection' },
            { id: 'ev-2', name: 'Cell Stacking', code: 'EV-20', time: 35.0, category: 'assembly' },
            { id: 'ev-3', name: 'Busbar Welding', code: 'EV-30', time: 45.0, category: 'soldering' },
            { id: 'ev-4', name: 'BMS Connection', code: 'EV-40', time: 25.0, category: 'assembly' },
            { id: 'ev-5', name: 'Coolant Leak Test', code: 'EV-50', time: 60.0, category: 'testing' },
            { id: 'ev-6', name: 'Final Housing', code: 'EV-60', time: 20.0, category: 'assembly' },
        ]
    },
    aerospace: {
        'avionics': [
            { id: 'av-1', name: 'PCB Mounting', code: 'AV-10', time: 35.5, category: 'assembly' },
            { id: 'av-2', name: 'Wiring Harness', code: 'AV-20', time: 55.0, category: 'assembly' },
            { id: 'av-3', name: 'Connector Crimping', code: 'AV-25', time: 22.5, category: 'assembly' },
            { id: 'av-4', name: 'Continuity Check', code: 'QC-10', time: 15.0, category: 'testing' },
            { id: 'av-5', name: 'FOD Guard', code: 'QA-01', time: 10.0, category: 'inspection' },
        ],
        'fuselage': [
            { id: 'fs-1', name: 'Panel Positioning', code: 'ST-10', time: 120.0, category: 'assembly' },
            { id: 'fs-2', name: 'Riveting (Auto)', code: 'ST-20', time: 45.0, category: 'machining' },
            { id: 'fs-3', name: 'Sealant Application', code: 'ST-30', time: 35.0, category: 'assembly' },
            { id: 'fs-4', name: 'NDT Inspection', code: 'QA-50', time: 60.0, category: 'inspection' },
        ]
    },
    electronics: {
        'pcb_smt': [
            { id: 'smt-1', name: 'Solder Paste', code: 'SMT-01', time: 12.0, category: 'soldering' },
            { id: 'smt-2', name: 'Pick & Place', code: 'SMT-05', time: 45.0, category: 'assembly' },
            { id: 'smt-3', name: 'Reflow Oven', code: 'SMT-10', time: 180.0, category: 'soldering' },
            { id: 'smt-4', name: 'AOI Inspection', code: 'QA-05', time: 15.0, category: 'inspection' },
        ],
        'box_build': [
            { id: 'bb-1', name: 'Sub-Assembly', code: 'ASY-10', time: 25.0, category: 'assembly' },
            { id: 'bb-2', name: 'Wiring Routing', code: 'ASY-20', time: 35.0, category: 'assembly' },
            { id: 'bb-3', name: 'Enclosure Close', code: 'ASY-30', time: 12.0, category: 'assembly' },
            { id: 'bb-4', name: 'Functional Test', code: 'QA-10', time: 45.0, category: 'testing' },
            { id: 'bb-5', name: 'Packaging', code: 'PKG-01', time: 10.0, category: 'packaging' },
        ]
    },
    textile: {
        'jeans': [
            { id: 'jean-1', name: 'Coser Entrepierna', code: 'GSD 5.8', time: 12.5, category: 'sewing' },
            { id: 'jean-2', name: 'Pegar Bolsillos', code: 'GSD 7.4', time: 18.3, category: 'sewing' },
            { id: 'jean-3', name: 'Coser Lateral', code: 'GSD 5.9', time: 14.2, category: 'sewing' },
            { id: 'jean-4', name: 'Poner Cierre', code: 'GSD 8.6', time: 22.5, category: 'sewing' },
            { id: 'jean-5', name: 'Pespunte', code: 'GSD 6.7', time: 15.8, category: 'sewing' },
            { id: 'jean-6', name: 'Pretina', code: 'GSD 7.9', time: 11.2, category: 'sewing' },
            { id: 'jean-7', name: 'Ruedo', code: 'GSD 9.1', time: 9.5, category: 'sewing' },
            { id: 'jean-8', name: 'Botón/Remache', code: 'GSD 10.3', time: 4.8, category: 'assembly' },
        ],
        'tshirt': [
            { id: 'tsh-1', name: 'Coser Hombros', code: 'GSD 5.2', time: 6.3, category: 'sewing' },
            { id: 'tsh-2', name: 'Pegar Mangas', code: 'GSD 7.1', time: 9.5, category: 'sewing' },
            { id: 'tsh-3', name: 'Cerrar Costados', code: 'GSD 5.6', time: 8.1, category: 'sewing' },
            { id: 'tsh-4', name: 'Ribete Cuello', code: 'GSD 6.4', time: 10.2, category: 'sewing' },
            { id: 'tsh-5', name: 'Ruedo Manga', code: 'GSD 7.3', time: 5.4, category: 'sewing' },
            { id: 'tsh-6', name: 'Ruedo Base', code: 'GSD 9.1', time: 7.8, category: 'sewing' },
        ],
        'safety_jacket': [
            { id: 'sj-1', name: 'Coser Reflejante', code: 'GSD 4.1', time: 15.0, category: 'sewing' },
            { id: 'sj-2', name: 'Unión Espalda', code: 'GSD 5.2', time: 22.0, category: 'sewing' },
            { id: 'sj-3', name: 'Cerrar Hombros', code: 'GSD 5.4', time: 18.5, category: 'sewing' },
            { id: 'sj-4', name: 'Colocar Cierre', code: 'GSD 8.2', time: 45.0, category: 'sewing' },
            { id: 'sj-5', name: 'Pegar Mangas', code: 'GSD 7.1', time: 28.0, category: 'sewing' },
            { id: 'sj-6', name: 'Inspección Calidad', code: 'QC-01', time: 12.0, category: 'inspection' },
        ]
    },
    footwear: {
        'sneaker': [
            { id: 'snk-1', name: 'Corte de Piezas', code: 'CUT-01', time: 45.0, category: 'machining' },
            { id: 'snk-2', name: 'Pespunte Capellada', code: 'ST-05', time: 65.0, category: 'sewing' },
            { id: 'snk-3', name: 'Montado de Puntera', code: 'LAS-10', time: 25.0, category: 'assembly' },
            { id: 'snk-4', name: 'Cementado Suela', code: 'BND-05', time: 18.0, category: 'assembly' },
            { id: 'snk-5', name: 'Prensado', code: 'PRS-01', time: 12.0, category: 'machining' },
            { id: 'snk-6', name: 'Limpieza y Acabado', code: 'FIN-10', time: 35.0, category: 'inspection' },
        ],
        'boot': [
            { id: 'bt-1', name: 'Troquelado Piel', code: 'CUT-10', time: 55.0, category: 'machining' },
            { id: 'bt-2', name: 'Desbaste de Bordes', code: 'SKV-05', time: 30.0, category: 'machining' },
            { id: 'bt-3', name: 'Costura Unión', code: 'ST-20', time: 85.0, category: 'sewing' },
            { id: 'bt-4', name: 'Ojillado', code: 'EYE-05', time: 20.0, category: 'assembly' },
            { id: 'bt-5', name: 'Montado Manual', code: 'LAS-20', time: 90.0, category: 'assembly' },
            { id: 'bt-6', name: 'Vulcanizado', code: 'VUL-10', time: 120.0, category: 'machining' },
        ]
    },
    pharmaceutical: {
        'blister_pack': [
            { id: 'ph-1', name: 'Granulación', code: 'GRN-01', time: 120.0, category: 'machining' },
            { id: 'ph-2', name: 'Compresión Tabletas', code: 'CMP-10', time: 30.0, category: 'machining' },
            { id: 'ph-3', name: 'Recubrimiento', code: 'COAT-05', time: 45.0, category: 'machining' },
            { id: 'ph-4', name: 'Blistering', code: 'BLS-10', time: 15.0, category: 'packaging' },
            { id: 'ph-5', name: 'Inspección Visual', code: 'QC-VIS', time: 10.0, category: 'inspection' },
            { id: 'ph-6', name: 'Empaque Secundario', code: 'PKG-20', time: 12.0, category: 'packaging' },
        ],
        'vaccine_vial': [
            { id: 'vv-1', name: 'Sterilization', code: 'VV-01', time: 180.0, category: 'machining' },
            { id: 'vv-2', name: 'Aseptic Filling', code: 'VV-10', time: 12.0, category: 'machining' },
            { id: 'vv-3', name: 'Stoppering', code: 'VV-20', time: 5.0, category: 'assembly' },
            { id: 'vv-4', name: 'Crimping', code: 'VV-30', time: 8.0, category: 'assembly' },
            { id: 'vv-5', name: 'Labeling', code: 'VV-40', time: 10.0, category: 'packaging' },
            { id: 'vv-6', name: 'Purity Check', code: 'VV-QC', time: 35.0, category: 'testing' },
        ]
    },
    food: {
        'bottling_line': [
            { id: 'fd-1', name: 'Enjuague Botellas', code: 'RIN-01', time: 5.0, category: 'machining' },
            { id: 'fd-2', name: 'Llenado', code: 'FIL-10', time: 8.0, category: 'machining' },
            { id: 'fd-3', name: 'Taponado', code: 'CAP-05', time: 4.0, category: 'assembly' },
            { id: 'fd-4', name: 'Etiquetado', code: 'LBL-10', time: 6.0, category: 'packaging' },
            { id: 'fd-5', name: 'Inspección Rayos X', code: 'QC-XR', time: 3.5, category: 'testing' },
            { id: 'fd-6', name: 'Empaque Final', code: 'PKG-50', time: 12.0, category: 'packaging' },
        ],
        'canning_line': [
            { id: 'can-1', name: 'Can Depalletizing', code: 'CAN-01', time: 2.0, category: 'machining' },
            { id: 'can-2', name: 'Sanitizing', code: 'CAN-05', time: 3.0, category: 'machining' },
            { id: 'can-3', name: 'Filling', code: 'CAN-10', time: 1.5, category: 'machining' },
            { id: 'can-4', name: 'Seaming', code: 'CAN-20', time: 0.8, category: 'assembly' },
            { id: 'can-5', name: 'Weight Check', code: 'CAN-QC', time: 1.2, category: 'testing' },
            { id: 'can-6', name: 'Carton Packing', code: 'CAN-30', time: 15.0, category: 'packaging' },
        ]
    },
    metalworking: {
        'chassis_welding': [
            { id: 'mt-1', name: 'Corte Láser', code: 'LAS-01', time: 45.0, category: 'machining' },
            { id: 'mt-2', name: 'Doblado CNC', code: 'BEND-10', time: 60.0, category: 'machining' },
            { id: 'mt-3', name: 'Soldadura MIG', code: 'WELD-20', time: 180.0, category: 'assembly' },
            { id: 'mt-4', name: 'Esmerilado', code: 'GRIND-05', time: 40.0, category: 'machining' },
            { id: 'mt-5', name: 'Pintura Electro.', code: 'PNT-10', time: 120.0, category: 'machining' },
            { id: 'mt-6', name: 'Control Calidad', code: 'QC-DIM', time: 25.0, category: 'inspection' },
        ]
    }
};
