import pandas as pd
import os

# Define data for Electric Motor Manufacturing
# Operations Data
operations_data = {
    'OPERATION': [
        'Corte de Lámina (Estator)', 
        'Estampado de Rotor', 
        'Aislamiento de Ranuras', 
        'Bobinado de Cobre (Automático)', 
        'Inserción de Bobinas', 
        'Conexión de Terminales', 
        'Impregnación VPI (Barniz)', 
        'Curado en Horno', 
        'Ensamble de Carcasa', 
        'Prueba de Hipot/Surge', 
        'Balanceo Dinámico', 
        'Empaque Final'
    ],
    'PROCESSCODE': [
        'OP-100', 'OP-110', 'OP-200', 'OP-300', 'OP-310', 'OP-320', 'OP-400', 'OP-410', 'OP-500', 'OP-600', 'OP-610', 'OP-700'
    ],
    'TIME_MIN': [
        0.5, 0.5, 1.2, 4.5, 2.0, 1.5, 15.0, 45.0, 3.5, 2.0, 2.5, 1.0
    ]
}

# Machine Types Data
machines_data = {
    'MACHINETYPE': [
        'Prensa Hidráulica', 
        'Bobinadora CNC', 
        'Horno Industrial', 
        'Balanceadora', 
        'Banco de Pruebas Eléctricas',
        'Robot de Ensamble'
    ],
    'BRAND': [
        'Schüler', 'Marsilli', 'Despatch', 'Schenck', 'Risatti', 'Fanuc'
    ],
    'MODEL': [
        'H-200T', 'W-800', 'VPI-OVEN-X', 'H50', 'TestPro-5000', 'M-20iB'
    ],
    'COST_PER_HOUR': [
        45.0, 25.0, 60.0, 30.0, 40.0, 15.0
    ]
}

def generate_excel():
    print("🚀 Generando Demo Vertical: Motores Eléctricos...")
    
    # Create DataFrames
    df_ops = pd.DataFrame(operations_data)
    df_machines = pd.DataFrame(machines_data)
    
    # Create Excel Writer
    file_name = 'demo_motores.xlsx'
    
    try:
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            # Write sheets with names that match the keywords in excelService.ts
            # keywords: ['PROCESS', 'OPERATION', 'OPERACION'] matches -> 'Operaciones'
            df_ops.to_excel(writer, sheet_name='Operaciones', index=False)
            
            # keywords: ['MACHINETYPE', 'BRAND', 'MARCA'] matches -> 'Maquinas'
            df_machines.to_excel(writer, sheet_name='Maquinas', index=False)
            
        print(f"✅ Archivo generado exitosamente: {os.path.abspath(file_name)}")
        print("📋 Contiene hojas: 'Operaciones' y 'Maquinas' compatibles con Manufactura IA Pro.")
        
    except Exception as e:
        print(f"❌ Error generando Excel: {e}")
        print("Asegúrate de tener instalados: pandas openpyxl")
        print("pip install pandas openpyxl")

if __name__ == "__main__":
    generate_excel()
