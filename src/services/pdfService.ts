import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const exportToPDF = async (elementId: string, fileName: string = "Reporte-Ingenieria-IA-AGUS.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const buttons = element.querySelectorAll('button');
    const resetIcons = element.querySelectorAll('.fa-sync, .fa-redo, .fa-plus');
    const brandingHeader = element.querySelector('.branding-header');

    // Hide controls
    buttons.forEach(btn => btn.style.display = 'none');
    resetIcons.forEach(icon => (icon as HTMLElement).style.display = 'none');

    // We hide the in-DOM branding header during screenshot to draw it manually on every PDF page
    if (brandingHeader) (brandingHeader as HTMLElement).style.opacity = '0';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      y: brandingHeader ? (brandingHeader as HTMLElement).offsetHeight : 0,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Force light theme on the container
          clonedElement.classList.remove('bg-cyber-dark', 'text-white', 'border-cyber-blue/20');
          clonedElement.classList.add('bg-white', 'text-slate-900', 'border-slate-200');

          // Force light theme on branding header
          const header = clonedElement.querySelector('.branding-header');
          if (header) {
            header.classList.remove('border-cyber-text');
            header.classList.add('border-slate-900');
            const title = header.querySelector('h1');
            if (title) {
              title.classList.remove('text-white', 'drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]');
              title.classList.add('text-slate-900');
            }
          }

          // Force dark text on all paragraphs and headings
          const textElements = clonedElement.querySelectorAll('h1, h2, h3, h4, p, span, div');
          textElements.forEach((el: any) => {
            // Remove cyber text classes
            el.classList.remove('text-white', 'text-cyber-blue', 'text-cyber-text', 'text-cyber-purple');
            el.style.textShadow = 'none'; // Remove glows

            // Heuristic: If it was white/cyber, make it slate-900. If it was distinct (blue/purple), make it indigo.
            if (el.classList.contains('text-white') || el.classList.contains('text-cyber-text')) {
              el.classList.add('text-slate-900');
            } else if (el.classList.contains('text-cyber-blue') || el.classList.contains('text-cyber-purple')) {
              el.classList.add('text-indigo-700');
            } else {
              el.style.color = '#0f172a'; // Default to slate-900
            }
          });

          // Force light backgrounds on cards
          const cards = clonedElement.querySelectorAll('.bg-cyber-black, .bg-cyber-dark');
          cards.forEach((card: any) => {
            card.classList.remove('bg-cyber-black', 'bg-cyber-dark', 'border-cyber-gray');
            card.classList.add('bg-white', 'border-slate-200');
            card.style.boxShadow = 'none';
            card.style.backgroundColor = 'white';
          });
        }
      }
    });

    // Restore internal visibility
    if (brandingHeader) (brandingHeader as HTMLElement).style.opacity = '1';

    const imgData = canvas.toDataURL('image/png', 1.0);

    // LETTER format: Width 215.9mm, Height 279.4mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9;
    const pdfHeight = 279.4;
    const headerHeight = 15; // Consistent top margin for dark branding bar
    const footerHeight = 12; // Consistent bottom margin
    const usableHeight = pdfHeight - headerHeight - footerHeight;

    // Scale image to fit the width exactly
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const totalPages = Math.ceil(imgHeight / usableHeight);

    const drawBranding = (p: any, pageNum: number, total: number) => {
      // Header Background (Dark Slate) - No gap above it
      p.setFillColor(15, 23, 42);
      p.rect(0, 0, pdfWidth, headerHeight, 'F');

      // Header Text
      p.setTextColor(255, 255, 255);
      p.setFont("helvetica", "bold");
      p.setFontSize(11);
      p.text("IA.AGUS", 10, headerHeight / 2 + 1);

      p.setFontSize(7);
      p.setFont("helvetica", "normal");
      p.text("www.ia-agus.com  |  Agustín Prieto. Engineering Labs.", 32, headerHeight / 2 + 1);

      p.setFontSize(7);
      const studyRef = `STUDY REF: ${Math.floor(Date.now() / 100000)}`;
      p.text(studyRef, pdfWidth - 10, headerHeight / 2 + 1, { align: 'right' });

      // Footer Background
      p.setFillColor(248, 250, 252);
      p.rect(0, pdfHeight - footerHeight, pdfWidth, footerHeight, 'F');

      // Footer Text
      p.setTextColor(100, 100, 100);
      p.setFontSize(7);
      p.text(`Page ${pageNum} of ${total}`, 10, pdfHeight - 5);
      p.text("IA.AGUS INDUSTRIAL SOLUTIONS - CONFIDENTIAL GSD/MTM DATA", pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      p.text("© " + new Date().getFullYear(), pdfWidth - 10, pdfHeight - 5, { align: 'right' });
    };

    let currentPage = 1;

    // First page content
    pdf.addImage(imgData, 'PNG', 0, headerHeight, imgWidth, imgHeight);
    drawBranding(pdf, currentPage, totalPages);

    // Multi-page logic
    while (currentPage < totalPages) {
      currentPage++;
      pdf.addPage('letter', 'portrait');

      // Shift content to reveal next slice
      // Content starts exactly below the dark header bar
      const yOffset = headerHeight - (currentPage - 1) * usableHeight;
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);

      drawBranding(pdf, currentPage, totalPages);
    }

    pdf.save(fileName);

    // Restore UI elements
    buttons.forEach(btn => btn.style.display = '');
    resetIcons.forEach(icon => (icon as HTMLElement).style.display = '');
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

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

  stations.forEach((station) => {
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

  // Set document property for the viewer title
  pdf.setProperties({
    title: `Line Balancing - ${garmentType} - IA.AGUS`
  });

  // Download with specific filename
  const fileName = `Line Balancing - ${garmentType} - IA.AGUS.pdf`;
  pdf.save(fileName);
};

// Export Regional Comparison to PDF
export const exportRegionalComparisonToPDF = (
  countries: Array<{ name: string; flag: string; hourlyWage: number; overhead: number; productivity: number; costPerPiece: number }>,
  sam: number,
  garmentName: string = 'General'
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
  pdf.text('REGIONAL COST COMPARISON', margin, 42);

  // Garment Type subtitle
  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`Garment: ${garmentName}`, margin, 50);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Standard SAM: ${sam} minutes`, margin, 56);
  pdf.text(`Total Countries Analyzed: ${countries.length}`, margin, 62);

  // Sort countries by cost
  const sorted = [...countries].sort((a, b) => a.costPerPiece - b.costPerPiece);

  // Most competitive
  let yPos = 71;
  pdf.setFillColor(220, 255, 220);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 128, 0);
  pdf.text('🏆 MOST COMPETITIVE', margin + 3, yPos + 7);
  pdf.setFontSize(14);
  pdf.text(`${sorted[0].name} - $${sorted[0].costPerPiece.toFixed(4)}/piece`, margin + 3, yPos + 15);
  pdf.setTextColor(0, 0, 0);
  yPos += 28;

  // Table header
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed Comparison', margin, yPos);
  yPos += 8;

  // Table
  pdf.setFillColor(220, 220, 220);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Country', margin + 2, yPos + 5);
  pdf.text('Wage/Hr', margin + 50, yPos + 5);
  pdf.text('Overhead', margin + 80, yPos + 5);
  pdf.text('Productivity', margin + 115, yPos + 5);
  pdf.text('Cost/Piece', margin + 155, yPos + 5);
  yPos += 10;

  pdf.setFont('helvetica', 'normal');
  sorted.forEach((country, index) => {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    // Zebra striping
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPos - 1, pageWidth - 2 * margin, 7, 'F');
    }

    pdf.setFontSize(9);
    pdf.text(`${country.name}`, margin + 2, yPos + 4);
    pdf.text(`$${country.hourlyWage}`, margin + 50, yPos + 4);
    pdf.text(`${country.overhead}%`, margin + 80, yPos + 4);
    pdf.text(`${country.productivity}%`, margin + 115, yPos + 4);

    // Highlight competitive prices
    if (index === 0) {
      pdf.setTextColor(0, 128, 0);
      pdf.setFont('helvetica', 'bold');
    }
    pdf.text(`$${country.costPerPiece.toFixed(4)}`, margin + 155, yPos + 4);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    yPos += 7;
  });

  // Summary
  yPos += 10;
  if (yPos > pageHeight - 40) {
    pdf.addPage();
    yPos = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, yPos);
  yPos += 8;

  const avgCost = countries.reduce((sum, c) => sum + c.costPerPiece, 0) / countries.length;
  const cheapestCost = sorted[0].costPerPiece;
  const mostExpensive = sorted[sorted.length - 1].costPerPiece;
  const savings = ((mostExpensive - cheapestCost) / mostExpensive) * 100;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`• Average cost per piece: $${avgCost.toFixed(4)}`, margin + 5, yPos);
  yPos += 6;
  pdf.text(`• Cost range: $${cheapestCost.toFixed(4)} - $${mostExpensive.toFixed(4)}`, margin + 5, yPos);
  yPos += 6;
  pdf.text(`• Potential savings: ${savings.toFixed(1)}% (choosing ${sorted[0].name} vs ${sorted[sorted.length - 1].name})`, margin + 5, yPos);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('IA.AGUS Engineering Labs | Regional Cost Analysis', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Set document property for the viewer title
  pdf.setProperties({
    title: `Regional Cost Comparison - ${garmentName} - IA.AGUS`
  });

  // Download with specific filename
  const fileName = `Regional Cost Comparison - ${garmentName} - IA.AGUS.pdf`;
  pdf.save(fileName);
};

// Export Costing Analysis to PDF (Light Theme - Print Friendly)
export const exportCostingToPDF = (
  sam: number,
  hourlyWage: number,
  efficiency: number,
  overhead: number
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
  pdf.text('COSTING ANALYSIS', margin, 42);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date().toLocaleDateString(), margin, 50);

  // Input Parameters
  let yPos = 62;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Input Parameters', margin, yPos);
  yPos += 10;

  const costPerMinute = (hourlyWage / 60) / (efficiency / 100);
  const laborCost = sam * costPerMinute;
  const totalCost = laborCost * (1 + overhead / 100);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`SAM (Standard Allowed Minutes): ${sam}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Hourly Wage: $${hourlyWage} USD`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Line Efficiency: ${efficiency}%`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Overhead: ${overhead}%`, margin + 5, yPos);
  yPos += 12;

  // Calculations
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cost Breakdown', margin, yPos);
  yPos += 10;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  yPos += 7;
  pdf.text(`Cost per Minute (effective): $${costPerMinute.toFixed(4)}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Direct Labor Cost: $${laborCost.toFixed(4)}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Overhead (+${overhead}%): $${(laborCost * (overhead / 100)).toFixed(4)}`, margin + 5, yPos);
  yPos += 7;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Total Cost per Piece: $${totalCost.toFixed(4)}`, margin + 5, yPos);
  yPos += 15;

  // Production Planning
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Production Planning', margin, yPos);
  yPos += 10;

  const workingHours = 8;
  const availableMinutes = workingHours * 60 * (efficiency / 100);
  const piecesPerDay = Math.floor(availableMinutes / sam);
  const dailyRevenue = piecesPerDay * totalCost * 3; // 3x markup

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Available Minutes/Day: ${availableMinutes.toFixed(0)} min`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Production Capacity: ${piecesPerDay} pieces/day`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Daily Revenue Potential (3x markup): $${dailyRevenue.toFixed(2)}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`Monthly Revenue Potential: $${(dailyRevenue * 22).toFixed(2)}`, margin + 5, yPos);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('IA.AGUS Engineering Labs | Costing Analysis', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Set document property for the viewer title
  pdf.setProperties({
    title: `Costing Analysis - IA.AGUS`
  });

  // Download with specific filename
  const fileName = `Costing Analysis - IA.AGUS.pdf`;
  pdf.save(fileName);
};