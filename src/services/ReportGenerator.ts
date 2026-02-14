import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { IndustrialAnalysis, CycleElement, ProcessImprovement } from '../types';

applyPlugin(jsPDF);

// Add this to make TypeScript happy with jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export const generatePDFReport = (
    analysis: IndustrialAnalysis,
    layoutImage?: string | null,
    userName: string = 'Authorized User',
    companyName: string = 'Manufactura IA Pro'
): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPos = margin;

    // --- HEADER ---
    doc.setFillColor(10, 25, 41); // Cyber Dark Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(0, 240, 255); // Cyber Blue
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('IA.AGUS INDUSTRIAL REPORT', margin, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 18);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, pageWidth - margin - 40, 23);
    doc.text(`User: ${userName}`, pageWidth - margin - 40, 28);
    doc.text(`Company: ${companyName}`, pageWidth - margin - 40, 33);

    yPos = 50;

    // --- EXECUTIVE SUMMARY ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(analysis.summary_text || 'No summary available.', pageWidth - (margin * 2));
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 5) + 10;

    // --- TECHNICAL SPECS ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Technical Specifications', margin, yPos);
    yPos += 8;

    doc.autoTable({
        startY: yPos,
        head: [['Attribute', 'Value']],
        body: [
            ['Operation Name', analysis.operation_name],
            ['Machine / Equipment', analysis.technical_specs.machine],
            ['Material', analysis.technical_specs.material],
            ['Standard Time', `${analysis.time_calculation.standard_time} min`],
            ['Units Per Hour', analysis.time_calculation.units_per_hour],
        ],
        theme: 'grid',
        headStyles: { fillColor: [10, 25, 41], textColor: [0, 240, 255] },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- IMPROVEMENTS (High Priority) ---
    if (analysis.improvements && analysis.improvements.length > 0) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = margin; }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Process Improvements', margin, yPos);
        yPos += 8;

        const impBody = analysis.improvements.map((imp: ProcessImprovement) => [
            imp.issue,
            imp.recommendation,
            imp.impact
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Issue', 'Recommendation', 'Impact']],
            body: impBody,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] }, // Red header for attention
            styles: { fontSize: 9 },
            margin: { left: margin, right: margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- CYCLE ANALYSIS (Detailed) ---
    if (yPos > pageHeight - 60) { doc.addPage(); yPos = margin; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Detailed Cycle Analysis', margin, yPos);
    yPos += 8;

    const cycleBody = analysis.cycle_analysis.map((cycle: CycleElement) => [
        cycle.element,
        cycle.time_seconds.toFixed(2) + 's',
        cycle.value_added ? 'Yes' : 'No',
        cycle.therblig || '-'
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Element', 'Time (s)', 'Value Added', 'Therblig']],
        body: cycleBody,
        theme: 'grid',
        headStyles: { fillColor: [10, 25, 41], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- MTM-1 ANALYSIS (If available) ---
    if (analysis.mtm_analysis && analysis.mtm_analysis.codes.length > 0) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = margin; }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('5. MTM-1 Motion Analysis', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total TMU: ${analysis.mtm_analysis.total_tmu}`, margin, yPos);
        yPos += 6;

        const mtmBody = analysis.mtm_analysis.codes.map(c => [
            c.code,
            c.description,
            c.tmu.toString()
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Code', 'Description', 'TMU']],
            body: mtmBody,
            theme: 'plain',
            headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 1 },
            margin: { left: margin, right: margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- LAYOUT / BLUEPRINT ---
    if (layoutImage) {
        doc.addPage();
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, pageHeight, 'F'); // Black background for layout

        doc.setTextColor(0, 240, 255);
        doc.setFontSize(16);
        doc.text('AI-GENERATED STATION LAYOUT', margin, 20);

        try {
            // Fit image into page
            const imgProps = doc.getImageProperties(layoutImage);
            const ratio = imgProps.width / imgProps.height;
            let w = pageWidth - (margin * 2);
            let h = w / ratio;

            if (h > pageHeight - 40) {
                h = pageHeight - 40;
                w = h * ratio;
            }

            doc.addImage(layoutImage, 'PNG', margin, 30, w, h);
        } catch (e) {
            console.error("Error adding layout image to PDF", e);
            doc.setTextColor(255, 0, 0);
            doc.text("Error rendering layout image.", margin, 40);
        }
    }

    // --- FOOTER (On all pages) ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Generated by IA.AGUS`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save the PDF
    doc.save(`IA_AGUS_Report_${analysis.operation_name.replace(/\s+/g, '_')}.pdf`);
};
