import pptxgen from 'pptxgenjs';

interface AnalysisData {
    fileName: string;
    operations: Array<{ operation: string; opCode: string; time: number }>;
    totalSAM: number;
    layoutImageUrl?: string;
    recommendations?: string[];
}

export const exportAnalysisToPowerPoint = (data: AnalysisData) => {
    const pptx = new pptxgen();

    // IA.AGUS Brand Colors (Cyberpunk theme)
    const BRAND_BLUE = '00F0FF';
    const BRAND_PURPLE = '7000FF';
    const DARK_BG = '0A0A0B';
    const TEXT_COLOR = 'E0E0E0';

    // Slide 1: Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: DARK_BG };

    titleSlide.addText('OPERATIONAL TIME STUDY ANALYSIS', {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: BRAND_BLUE,
        align: 'center',
    });

    titleSlide.addText(`Study: ${data.fileName}`, {
        x: 0.5,
        y: 3,
        w: 9,
        h: 0.6,
        fontSize: 24,
        color: TEXT_COLOR,
        align: 'center',
    });

    titleSlide.addText(`Total SAM: ${data.totalSAM.toFixed(3)} minutes`, {
        x: 0.5,
        y: 3.8,
        w: 9,
        h: 0.5,
        fontSize: 20,
        color: BRAND_PURPLE,
        align: 'center',
    });

    // Footer
    titleSlide.addText('IA.AGUS Engineering Labs | www.ia-agus.com', {
        x: 0.5,
        y: 7,
        w: 9,
        h: 0.4,
        fontSize: 12,
        color: '666666',
        align: 'center',
        italic: true,
    });

    // Slide 2: Operations Breakdown
    const opsSlide = pptx.addSlide();
    opsSlide.background = { color: DARK_BG };

    opsSlide.addText('OPERATION BREAKDOWN', {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: BRAND_BLUE,
    });

    // Table data
    const tableData: any[][] = [
        [
            { text: 'Operation', options: { bold: true, color: BRAND_BLUE } },
            { text: 'Op. Code', options: { bold: true, color: BRAND_BLUE } },
            { text: 'Time (min)', options: { bold: true, color: BRAND_BLUE } },
            { text: '% of Total', options: { bold: true, color: BRAND_BLUE } },
        ],
    ];

    data.operations.forEach((op) => {
        const percentage = (op.time / data.totalSAM) * 100;
        tableData.push([
            { text: op.operation, options: { color: TEXT_COLOR } },
            { text: op.opCode, options: { color: BRAND_PURPLE } },
            { text: op.time.toFixed(3), options: { color: TEXT_COLOR } },
            { text: percentage.toFixed(1) + '%', options: { color: TEXT_COLOR } },
        ]);
    });

    opsSlide.addTable(tableData, {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 5.2,
        fontSize: 11,
        color: TEXT_COLOR,
        fill: { color: '1A1A1F' },
        border: { pt: 1, color: '333333' },
        rowH: 0.35,
    });

    // Slide 3: Layout Image (if available)
    if (data.layoutImageUrl) {
        const layoutSlide = pptx.addSlide();
        layoutSlide.background = { color: DARK_BG };

        layoutSlide.addText('PROPOSED LAYOUT', {
            x: 0.5,
            y: 0.4,
            w: 9,
            h: 0.6,
            fontSize: 32,
            bold: true,
            color: BRAND_BLUE,
        });

        layoutSlide.addImage({
            path: data.layoutImageUrl,
            x: 0.8,
            y: 1.3,
            w: 8.4,
            h: 5.5,
        });
    }

    // Slide 4: Key Findings & Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        const recSlide = pptx.addSlide();
        recSlide.background = { color: DARK_BG };

        recSlide.addText('KEY RECOMMENDATIONS', {
            x: 0.5,
            y: 0.4,
            w: 9,
            h: 0.6,
            fontSize: 32,
            bold: true,
            color: BRAND_BLUE,
        });

        let yPos = 1.5;
        data.recommendations.forEach((rec, index) => {
            recSlide.addText(`${index + 1}. ${rec}`, {
                x: 1,
                y: yPos,
                w: 8,
                h: 0.6,
                fontSize: 16,
                color: TEXT_COLOR,
                bullet: true,
            });
            yPos += 0.8;
        });
    }

    // Generate file
    const fileName = `Operational_Analysis_${data.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.pptx`;
    pptx.writeFile({ fileName });
};

// Export Line Balancing to PowerPoint
export const exportLineBalancingToPowerPoint = (
    stations: Array<{
        id: string;
        operations: Array<{ name: string; opCode: string; time: number }>;
    }>,
    targetCycleTime: number,
    garmentType: string
) => {
    const pptx = new pptxgen();

    const BRAND_BLUE = '00F0FF';
    const DARK_BG = '0A0A0B';
    const TEXT_COLOR = 'E0E0E0';

    // Slide 1: Title
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: DARK_BG };

    titleSlide.addText('LINE BALANCING ANALYSIS', {
        x: 0.5,
        y: 2,
        w: 9,
        h: 1.2,
        fontSize: 44,
        bold: true,
        color: BRAND_BLUE,
        align: 'center',
    });

    titleSlide.addText(`Garment Type: ${garmentType}`, {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 22,
        color: TEXT_COLOR,
        align: 'center',
    });

    titleSlide.addText(`Target Cycle Time: ${targetCycleTime.toFixed(2)} min`, {
        x: 0.5,
        y: 4.2,
        w: 9,
        h: 0.5,
        fontSize: 20,
        color: '00FF88',
        align: 'center',
    });

    // Slide 2: Station Summary
    const summarySlide = pptx.addSlide();
    summarySlide.background = { color: DARK_BG };

    summarySlide.addText('STATION SUMMARY', {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: BRAND_BLUE,
    });

    const tableData: any[][] = [
        [
            { text: 'Station', options: { bold: true, color: BRAND_BLUE } },
            { text: 'Cycle Time', options: { bold: true, color: BRAND_BLUE } },
            { text: 'Utilization', options: { bold: true, color: BRAND_BLUE } },
            { text: 'Status', options: { bold: true, color: BRAND_BLUE } },
        ],
    ];

    stations.forEach((station, index) => {
        const cycleTime = station.operations.reduce((sum, op) => sum + op.time, 0);
        const utilization = (cycleTime / targetCycleTime) * 100;
        const isBottleneck = cycleTime > targetCycleTime;

        tableData.push([
            { text: `Station ${index + 1}`, options: { color: TEXT_COLOR } },
            { text: cycleTime.toFixed(3) + ' min', options: { color: TEXT_COLOR } },
            { text: utilization.toFixed(1) + '%', options: { color: isBottleneck ? 'FF4444' : '00FF88' } },
            {
                text: isBottleneck ? 'BOTTLENECK' : 'OK',
                options: { color: isBottleneck ? 'FF4444' : '00FF88', bold: isBottleneck },
            },
        ]);
    });

    summarySlide.addTable(tableData, {
        x: 1.5,
        y: 1.5,
        w: 7,
        h: 4,
        fontSize: 14,
        color: TEXT_COLOR,
        fill: { color: '1A1A1F' },
        border: { pt: 1, color: '333333' },
    });

    // Generate file
    pptx.writeFile({ fileName: `Line_Balancing_${garmentType}_${Date.now()}.pptx` });
};
