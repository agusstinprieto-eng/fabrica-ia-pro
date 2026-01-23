import * as XLSX from 'xlsx';

interface Operation {
    id: string;
    name: string;
    opCode: string;
    time: number;
}

interface Station {
    id: string;
    operations: Operation[];
}

// Helper to finding sheet with specific headers
const findSheetWithHeaders = (workbook: XLSX.WorkBook, keywords: string[], preferredSheetName?: string): any[] | null => {
    let debugInfo = `Sheets found: ${workbook.SheetNames.join(', ')}\n`;

    // Sort sheets: preferred one first
    const sortedSheetNames = [...workbook.SheetNames].sort((a, b) => {
        if (preferredSheetName && a.toLowerCase().includes(preferredSheetName)) return -1;
        if (preferredSheetName && b.toLowerCase().includes(preferredSheetName)) return 1;
        return 0;
    });

    for (const sheetName of sortedSheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Peek at first 10 rows for headers
        const rowsToCheck = rawData.slice(0, 10);

        let headerRowIndex = -1;
        for (let i = 0; i < rowsToCheck.length; i++) {
            const row = rowsToCheck[i];

            if (row && row.length > 0) {
                const rowStr = row.map(c => String(c).substring(0, 15)).join(", ");
                debugInfo += `[${sheetName}:R${i}]: ${rowStr} ...\n`;
            }

            // aggressive matching
            if (row.some((cell: any) =>
                cell && typeof cell === 'string' &&
                keywords.some(k => cell.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(k.replace(/[^A-Z0-9]/g, '')))
            )) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex !== -1) {
            return XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
        }
    }

    throw new Error(`Headers not found. Searched for [${keywords.join(', ')}]. \nLog:\n${debugInfo}`);
};

// Read Operations from Excel with dynamic header detection
export const readOperationsFromExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                try {
                    const jsonData = findSheetWithHeaders(workbook, ['PROCESS', 'OPERATION', 'OPERACION', 'PROCESSCODE'], 'operacion');
                    resolve(jsonData);
                } catch (err) {
                    throw err;
                }
            } catch (error) { reject(error); }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

// Read Machine Types from Excel
export const readMachinesFromExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                // Expanded keywords for machines
                try {
                    const jsonData = findSheetWithHeaders(
                        workbook,
                        // Buscamos: Machine Tyoe, Brand, Marca, Maquina, Codigo, Modelo, Description
                        ['MACHINETYPE', 'BRAND', 'MARCA', 'MAQUINA', 'TYPE', 'CODIGO', 'CODE', 'MODEL', 'DESCRIPCION', 'DESCRIPTION'],
                        'maquina' // Prefer sheet names with 'maquina'
                    );
                    resolve(jsonData);
                } catch (err) {
                    throw err;
                }
            } catch (error) { reject(error); }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

// Export Line Balancing to Excel with Gantt chart
export const exportLineBalancingToExcel = (
    stations: Station[],
    targetCycleTime: number,
    garmentType: string
) => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Operations Breakdown
    const operationsData: any[][] = [
        ['IA.AGUS - Line Balancing Analysis'],
        ['Garment Type:', garmentType],
        ['Target Cycle Time:', `${targetCycleTime.toFixed(2)} min`],
        [],
        ['Station', 'Operation', 'Op. Code', 'Time (min)', 'Cumulative Time'],
    ];

    let cumulativeTime = 0;
    stations.forEach((station, index) => {
        station.operations.forEach((op, opIndex) => {
            cumulativeTime += op.time;
            operationsData.push([
                opIndex === 0 ? `Station ${index + 1}` : '',
                op.name,
                op.opCode,
                op.time.toFixed(3),
                cumulativeTime.toFixed(3),
            ]);
        });
    });

    const ws1 = XLSX.utils.aoa_to_sheet(operationsData);

    // Auto-size columns
    const colWidths = [
        { wch: 15 }, // Station
        { wch: 35 }, // Operation
        { wch: 12 }, // Op. Code
        { wch: 12 }, // Time
        { wch: 18 }, // Cumulative
    ];
    ws1['!cols'] = colWidths;

    // Style header
    const headerRange = XLSX.utils.decode_range(ws1['!ref'] || 'A1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '5';
        if (!ws1[address]) continue;
        ws1[address].s = {
            font: { bold: true, color: { rgb: '00F0FF' } },
            fill: { fgColor: { rgb: '0A0A0B' } },
        };
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Operations');

    // Sheet 2: Station Summary
    const summaryData: any[][] = [
        ['Station Summary'],
        [],
        ['Station', 'Cycle Time (min)', 'Utilization %', 'Status'],
    ];

    stations.forEach((station, index) => {
        const cycleTime = station.operations.reduce((sum, op) => sum + op.time, 0);
        const utilization = (cycleTime / targetCycleTime) * 100;
        const status = cycleTime > targetCycleTime ? 'BOTTLENECK' : 'OK';

        summaryData.push([
            `Station ${index + 1}`,
            cycleTime.toFixed(3),
            utilization.toFixed(1),
            status,
        ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    ws2['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Station Summary');

    // Sheet 3: Gantt Chart Data (for manual visualization)
    const ganttData: any[][] = [
        ['Gantt Chart Data'],
        [],
        ['Station', 'Start Time', 'End Time', 'Duration', 'Operation Names'],
    ];

    let startTime = 0;
    stations.forEach((station, index) => {
        const cycleTime = station.operations.reduce((sum, op) => sum + op.time, 0);
        const opNames = station.operations.map((op) => op.name).join(', ');

        ganttData.push([
            `Station ${index + 1}`,
            startTime.toFixed(3),
            (startTime + cycleTime).toFixed(3),
            cycleTime.toFixed(3),
            opNames,
        ]);

        startTime += cycleTime;
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ganttData);
    ws3['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Gantt Data');

    // Generate file
    XLSX.writeFile(wb, `Line_Balancing_${garmentType}_${Date.now()}.xlsx`);
};

// Export Costing Analysis to Excel
export const exportCostingToExcel = (
    sam: number,
    hourlyWage: number,
    efficiency: number,
    overhead: number
) => {
    const wb = XLSX.utils.book_new();

    const costPerMinute = hourlyWage / 60;
    const effectiveSAM = sam / (efficiency / 100);
    const laborCost = effectiveSAM * costPerMinute;
    const totalCost = laborCost * (1 + overhead / 100);

    const data: any[][] = [
        ['IA.AGUS - Costing Analysis'],
        [],
        ['Input Parameters'],
        ['SAM (Standard Allowed Minutes):', sam],
        ['Hourly Wage (USD):', hourlyWage],
        ['Line Efficiency (%):', efficiency],
        ['Overhead (%):', overhead],
        [],
        ['Calculations'],
        ['Cost per Minute (USD):', costPerMinute.toFixed(4)],
        ['Effective SAM (adjusted for efficiency):', effectiveSAM.toFixed(3)],
        ['Direct Labor Cost (USD):', laborCost.toFixed(4)],
        ['Total Cost with Overhead (USD):', totalCost.toFixed(4)],
        [],
        ['Production Planning'],
        ['Daily Production (8 hours, 60% efficiency):', Math.floor((8 * 60 * (efficiency / 100)) / sam)],
        ['Daily Revenue (at $15/piece):', `$${(Math.floor((8 * 60 * (efficiency / 100)) / sam) * 15).toFixed(2)}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Costing Analysis');
    XLSX.writeFile(wb, `Costing_Analysis_${Date.now()}.xlsx`);
};

// Export Regional Comparison to Excel
export const exportRegionalComparisonToExcel = (
    countries: Array<{
        name: string;
        flag: string;
        hourlyWage: number;
        overhead: number;
        productivity: number;
        costPerPiece: number;
    }>,
    sam: number
) => {
    const wb = XLSX.utils.book_new();

    const data: any[][] = [
        ['IA.AGUS - Regional Cost Comparison'],
        ['Standard SAM:', sam],
        [],
        ['Country', 'Hourly Wage (USD)', 'Overhead (%)', 'Productivity (%)', 'Cost per Piece (USD)', 'Ranking'],
    ];

    // Sort by cost
    const sorted = [...countries].sort((a, b) => a.costPerPiece - b.costPerPiece);

    sorted.forEach((country, index) => {
        data.push([
            country.name,
            country.hourlyWage,
            country.overhead,
            country.productivity,
            country.costPerPiece.toFixed(4),
            index + 1,
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Regional Comparison');
    XLSX.writeFile(wb, `Regional_Comparison_${Date.now()}.xlsx`);
};

// Export Operational Analysis to Excel
export const exportAnalysisToExcel = (
    operations: Array<{ operation: string; opCode: string; time: number }>,
    totalSAM: number,
    fileName: string
) => {
    const wb = XLSX.utils.book_new();

    const data: any[][] = [
        ['IA.AGUS - Operational Time Study Analysis'],
        ['Study:', fileName],
        ['Total SAM:', totalSAM.toFixed(3)],
        [],
        ['Operation', 'Op. Code', 'Time (min)', '% of Total'],
    ];

    operations.forEach((op) => {
        const percentage = (op.time / totalSAM) * 100;
        data.push([op.operation, op.opCode, op.time.toFixed(3), percentage.toFixed(1) + '%']);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Operational Analysis');
    XLSX.writeFile(wb, `Operational_Analysis_${fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.xlsx`);
};
