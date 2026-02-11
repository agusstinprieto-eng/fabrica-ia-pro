import csv
import os

def generate_csv_demos():
    print("🚀 Generando Demo Vertical: Motores Eléctricos (Formato CSV)...")
    
    # 1. Operations CSV
    # Headers matching excelService.ts: ['PROCESS', 'OPERATION', 'OPERACION', 'PROCESSCODE']
    ops_headers = ['OPERATION', 'PROCESSCODE', 'TIME_MIN']
    ops_data = [
        ['Corte de Lámina (Estator)', 'OP-100', 0.5],
        ['Estampado de Rotor', 'OP-110', 0.5],
        ['Aislamiento de Ranuras', 'OP-200', 1.2],
        ['Bobinado de Cobre (Automático)', 'OP-300', 4.5],
        ['Inserción de Bobinas', 'OP-310', 2.0],
        ['Conexión de Terminales', 'OP-320', 1.5],
        ['Impregnación VPI (Barniz)', 'OP-400', 15.0],
        ['Curado en Horno', 'OP-410', 45.0],
        ['Ensamble de Carcasa', 'OP-500', 3.5],
        ['Prueba de Hipot/Surge', 'OP-600', 2.0],
        ['Balanceo Dinámico', 'OP-610', 2.5],
        ['Empaque Final', 'OP-700', 1.0]
    ]
    
    with open('demo_motores_operaciones.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(ops_headers)
        writer.writerows(ops_data)
    print(f"✅ Generated: {os.path.abspath('demo_motores_operaciones.csv')}")

    # 2. Machines CSV
    # Headers: ['MACHINETYPE', 'BRAND', 'MARCA', 'MAQUINA', 'MODEL', 'COST_PER_HOUR']
    mach_headers = ['MACHINETYPE', 'BRAND', 'MODEL', 'COST_PER_HOUR']
    mach_data = [
        ['Prensa Hidráulica', 'Schüler', 'H-200T', 45.0],
        ['Bobinadora CNC', 'Marsilli', 'W-800', 25.0],
        ['Horno Industrial', 'Despatch', 'VPI-OVEN-X', 60.0],
        ['Balanceadora', 'Schenck', 'H50', 30.0],
        ['Banco de Pruebas Eléctricas', 'Risatti', 'TestPro-5000', 40.0],
        ['Robot de Ensamble', 'Fanuc', 'M-20iB', 15.0]
    ]
    
    with open('demo_motores_maquinas.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(mach_headers)
        writer.writerows(mach_data)
    print(f"✅ Generated: {os.path.abspath('demo_motores_maquinas.csv')}")
    
    print("\nℹ️ NOTE: You can upload these CSV files directly into the 'Upload Excel' area.")

if __name__ == "__main__":
    generate_csv_demos()
