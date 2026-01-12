// Export Line Balancing to PDF (Light Theme - Print Friendly)
export const exportLineBalancingToPDF = (
    stations: Array<{ id: string; name: string; operations: Array<{ name: string; code: string; time: number }> }>,
    targetCycleTime: number,
    garmentType: string
) => {
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Header (LIGHT THEME - Print Friendly)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 30, pageWidth - margin, 30);

    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IA.AGUS', margin, 15);

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('www.ia-agus.com', margin, 22);
    pdf.text('Agustín Prieto. Engineering Labs.', margin, 27);

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LINE BALANCING ANALYSIS', margin, 42);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Garment Type: ${garmentType}`, margin, 50);
    pdf.text(`Target Cycle Time: ${targetCycleTime.toFixed(2)} min`, margin, 56);

    // Station Summary Table
    let yPos = 67;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Station Summary', margin, yPos);
    yPos += 8;

    // Table header
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Station', margin + 3, yPos + 5);
    pdf.text('Operations', margin + 40, yPos + 5);
    pdf.text('Cycle Time', margin + 120, yPos + 5);
    pdf.text('Status', margin + 160, yPos + 5);
    yPos += 10;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    stations.forEach((station, index) => {
        const cycleTime = station.operations.reduce((sum, op) => sum + op.time, 0);
        const isBottleneck = cycleTime > targetCycleTime;

        pdf.text(`Station ${index + 1}`, margin + 3, yPos + 5);
        pdf.text(`${station.operations.length} ops`, margin + 40, yPos + 5);
        pdf.text(`${cycleTime.toFixed(2)} min`, margin + 120, yPos + 5);

        pdf.setTextColor(isBottleneck ? 255 : 0, isBottleneck ? 0 : 180, 0);
        pdf.text(isBottleneck ? 'BOTTLENECK' : 'OK', margin + 160, yPos + 5);
        pdf.setTextColor(0, 0, 0);

        yPos += 8;
    });

    // Operations Detail (new page if needed)
    if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
    } else {
        yPos += 10;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Operations Detail', margin, yPos);
    yPos += 8;

    stations.forEach((station, stationIndex) => {
        if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${station.name}:`, margin, yPos);
        yPos += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        station.operations.forEach((op) => {
            if (yPos > pageHeight - 20) {
                pdf.addPage();
                yPos = 20;
            }
            pdf.text(`• ${op.name} (${op.code}) - ${op.time.toFixed(2)} min`, margin + 5, yPos);
            yPos += 5;
        });

        yPos += 3;
    });

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`IA.AGUS Engineering Labs | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`Line_Balancing_${garmentType}_${Date.now()}.pdf`);
};
