import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const exportToPDF = async (elementId: string, fileName: string = "Reporte-Ingenieria-IA-AGUS.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // 1. Create a specific clone for PDF generation that we can mutate safely
    const containerClone = element.cloneNode(true) as HTMLElement;

    // Apply PDF-specific styles to the clone
    containerClone.style.width = '800px'; // Fixed width for consistent capture
    containerClone.style.padding = '40px';
    containerClone.style.background = 'white';
    containerClone.classList.remove('bg-cyber-dark', 'text-white', 'border-cyber-blue/20', 'shadow-[0_0_30px_rgba(0,0,0,0.5)]');
    containerClone.classList.add('text-slate-900');

    // CRITICAL FIX: Ensure container expands to fit all content
    containerClone.style.height = 'auto';
    containerClone.style.overflow = 'visible';
    containerClone.style.maxHeight = 'none';

    // Typography Adjustments - Reduce font sizes globally
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      #pdf-stage * { font-family: 'Helvetica', 'Arial', sans-serif !important; color: #334155 !important; text-shadow: none !important; }
      #pdf-stage h1 { font-size: 24pt !important; color: #0f172a !important; }
      #pdf-stage h2 { font-size: 10pt !important; letter-spacing: 0.2em !important; color: #64748b !important; }
      #pdf-stage h3 { font-size: 18pt !important; color: #0c4a6e !important; } /* Sky-900 */
      #pdf-stage h4 { font-size: 14pt !important; color: #0369a1 !important; } /* Sky-700 */
      #pdf-stage p, #pdf-stage span, #pdf-stage div { font-size: 10pt !important; line-height: 1.5 !important; }
      
      /* Header & Branding */
      #pdf-stage .branding-header { border-bottom: 2px solid #0ea5e9 !important; margin-bottom: 20px !important; padding-bottom: 10px !important; }
      
      /* Theme Overrides - Light Blue/Gray */
      #pdf-stage .bg-cyber-black { background-color: #f0f9ff !important; color: #0c4a6e !important; border: 1px solid #bae6fd !important; }
      #pdf-stage .bg-cyber-dark { background-color: #ffffff !important; color: #334155 !important; border: none !important; }
      #pdf-stage .text-white { color: #0f172a !important; }
      #pdf-stage .text-cyber-blue { color: #0284c7 !important; }
      #pdf-stage .border-cyber-blue { border-color: #0284c7 !important; }
      #pdf-stage .bg-cyber-purple { background-color: #f1f5f9 !important; } 
      #pdf-stage .text-cyber-purple { color: #475569 !important; }

      /* CRITICAL: HIDE LAYOUT OVERLAYS */
      #pdf-stage .absolute.bottom-0.inset-x-0 { display: none !important; }
      #pdf-stage .absolute.top-3.left-3 { display: none !important; }
      
      /* Hide dark overlays */
      #pdf-stage .bg-cyber-black\\/90 { display: none !important; }
      #pdf-stage .backdrop-blur-md { display: none !important; }
    `;
    containerClone.appendChild(styleSheet);

    // Staging area
    const stage = document.createElement('div');
    stage.id = 'pdf-stage';
    stage.style.position = 'absolute';
    stage.style.left = '-9999px';
    stage.style.top = '0';
    stage.style.width = '800px';
    stage.appendChild(containerClone);
    document.body.appendChild(stage);

    // 2. Identify Logical Sections for Chunking
    // We can't just screenshot the whole thing because of page breaks.
    // We need to identify specific child blocks to capture.

    // Flatten logic: 
    // - Header
    // - Title
    // - Images Grid
    // - Specific sections inside the text area
    // - Layout
    // - Footer

    const captureBlocks: HTMLElement[] = [];

    // Helpers
    const query = (s: string) => containerClone.querySelector(s) as HTMLElement;
    const queryAll = (s: string) => Array.from(containerClone.querySelectorAll(s)) as HTMLElement[];

    const brandingHeader = query('.branding-header');
    const titleSection = query('.bg-cyber-black'); // The box with "Industrial Engineering Report"
    const imagesSection = query('.space-y-8'); // First one usually images
    const analysisWrapper = query('.space-y-16'); // The big text wrapper
    const layoutSection = queryAll('.space-y-8').pop(); // Usually layout is near end
    const footer = containerClone.children[containerClone.children.length - 2]; // Usually 2nd to last or last

    if (brandingHeader) captureBlocks.push(brandingHeader);
    if (titleSection) captureBlocks.push(titleSection);

    // Images (might match layout section selector, be careful)
    // Heuristic: Check contents.
    queryAll('.space-y-8').forEach(block => {
      if (block.innerHTML.includes('Visual Process Documentation') || block.innerHTML.includes('Proposed Layout Architecture')) {
        captureBlocks.push(block);
      }
    });

    // Analysis Sections (The most important part to chunk)
    if (analysisWrapper) {
      // HELPER: Recursively find capture-worthy atomic blocks
      const findAtomicBlocks = (element: HTMLElement): HTMLElement[] => {
        const blocks: HTMLElement[] = [];
        const children = Array.from(element.children) as HTMLElement[];

        // If no children, return self if visible
        if (children.length === 0) {
          if (element.innerText.trim().length > 0) return [element];
          return [];
        }

        // Iterate children
        for (const child of children) {
          // If it's a structural container (like the page-break-section wrapper), dive in
          // If it's a specific content block (p, h3, div.flex for lists), capture it

          const tagName = child.tagName.toLowerCase();

          // If it sends a page break signal or is a large wrapper, dive deeper
          if (child.classList.contains('page-break-section') || child.classList.contains('space-y-8')) {
            blocks.push(...findAtomicBlocks(child));
            continue;
          }

          // Atomic blocks we want to capture directly
          // - Headings
          // - Paragraphs
          // - Flex containers (used for lists in AnalysisDisplay)
          // - Divs that are direct children of the text wrapper
          if (['h1', 'h2', 'h3', 'h4', 'p', 'img', 'li'].includes(tagName)) {
            blocks.push(child);
          }
          // CRITICAL FIX: Capture all horizontal FLEX rows as single atomic blocks.
          // We also include 'gap-2' which is used for the responsive key-value pairs (flex-col sm:flex-row gap-2)
          else if (child.classList.contains('flex') && (!child.classList.contains('flex-col') || child.classList.contains('gap-2'))) {
            blocks.push(child);
          }
          else {
            blocks.push(...findAtomicBlocks(child));
          }
        }
        return blocks;
      };

      // Collect all atomic blocks from the wrapper
      captureBlocks.push(...findAtomicBlocks(analysisWrapper));
    }

    // Footer - grab the last big flex container
    const lastElements = Array.from(containerClone.children);
    const potentialFooter = lastElements[lastElements.length - 1] as HTMLElement;
    // Enhanced footer detection
    if (potentialFooter && (potentialFooter.innerHTML.includes('Agustín Prieto') || potentialFooter.classList.contains('mt-24'))) {
      captureBlocks.push(potentialFooter);
    }

    // Deduplicate blocks just in case
    const uniqueBlocks = [...new Set(captureBlocks)];

    // 3. Initialize PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 20; // Increased to 20mm for professional look
    const contentWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);

    let currentY = margin;

    // Helper to add new page
    const addNewPage = () => {
      pdf.addPage();
      currentY = margin;
    };

    // 4. Capture and Add Blocks
    for (const block of uniqueBlocks) {
      // Temporarily ensure block is visible and laid out for capture
      // We capture it from the staging area
      const canvas = await html2canvas(block, {
        scale: 2, // Better quality
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 800 // Match container width to prevent reflow issues
      });

      const imgData = canvas.toDataURL('image/png');
      // LOGIC FIX: Calculate dimensions based on actual capture size relative to container
      // This allows small elements (w-fit) to stay small and full-width elements to fill the page
      // canvas.width is (CSS Width * scale), so we divide by 2 (scale) first to get CSS px
      const cssWidth = canvas.width / 2;
      const cssHeight = canvas.height / 2;

      // Scale factor: (PDF Content Width mm) / (Container Width px [800])
      const pxToMmScale = contentWidth / 800;

      const pdfImgWidth = cssWidth * pxToMmScale;
      const pdfImgHeight = cssHeight * pxToMmScale;

      // ORPHAN PREVENTION LOGIC:
      // Detect if this block is a header/title. If so, we need MORE space to ensure 
      // it doesn't appear at the bottom without its content.
      const isHeader = ['H1', 'H2', 'H3', 'H4'].includes(block.tagName) ||
        /^\d{2}/.test(block.innerText) || // Matches "04 LAYOUT..."
        block.innerText.includes('TECHNICAL SHEET') ||
        block.innerText.includes('FICHA TÉCNICA');

      // Headers need 65mm (to keep some content with them), others need 45mm
      // 45mm is the tested sweet spot: 35mm was too tight, 50mm was too loose.
      const safetyBuffer = isHeader ? 65 : 45;

      const effectivePageLimit = pageHeight - margin - safetyBuffer;

      // Add a small 5mm buffer to the height check itself for component variance
      if (currentY + pdfImgHeight + 5 > effectivePageLimit) {
        addNewPage();
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight);
      currentY += pdfImgHeight + 3; // Vertical spacing
    }

    // Add Page Numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      // Move footer up to 15mm from bottom (standard print margin is 10-15mm)
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      pdf.text("IA.AGUS - CONFIDENTIAL", margin, pageHeight - 15);
    }

    pdf.save(fileName);

    // Cleanup
    document.body.removeChild(stage);

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
  pdf.text(`Operation Type: ${garmentType}`, margin, 50);
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