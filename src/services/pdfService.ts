import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Helper to get settings
const getSettings = () => {
  try {
    const stored = localStorage.getItem('costura-ia-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading settings", e);
  }
  return null;
};

// Formatting helper for currency and numbers
const formatUSD = (val: number, decimals: number = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
};

const formatNum = (val: number, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
};

export const exportToPDF = async (elementId: string, fileName: string = "Reporte-Ingenieria.pdf", coverImage?: string | null) => {
  const settings = getSettings();
  const companyName = "MANUFACTURA IA PRO";
  let companyLogo = settings?.companyLogo || '';

  // PRE-FETCH BLUE LOGO (override default)
  try {
    const logoResponse = await fetch('/ia-agus-blue.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      companyLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (e) {
    console.warn("Failed to load blue logo", e);
  }

  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // 1. Create a specific clone for PDF generation that we can mutate safely
    const containerClone = element.cloneNode(true) as HTMLElement;

    // Apply PDF-specific styles to the clone - AGGRESSIVE RESET
    containerClone.style.width = '800px'; // Fixed width for consistent capture
    containerClone.style.padding = '40px';
    containerClone.style.background = '#ffffff'; // Force pure white
    containerClone.style.color = '#0f172a'; // Slate 900

    // Convert all text colors to dark
    const allElements = containerClone.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      el.style.color = '#0f172a';
      el.style.backgroundColor = 'transparent';
      if (el.classList.contains('bg-cyber-dark') || el.classList.contains('bg-cyber-black')) {
        el.style.backgroundColor = '#ffffff';
      }
    }

    containerClone.classList.remove('bg-cyber-dark', 'text-white', 'border-cyber-blue/20', 'shadow-[0_0_30px_rgba(0,0,0,0.5)]');
    containerClone.classList.add('text-slate-900', 'bg-white');

    // CRITICAL: Remove elements hidden in print
    const hiddenElements = containerClone.querySelectorAll('.print\\:hidden');
    hiddenElements.forEach(el => el.remove());

    // CRITICAL ENABLE: Force 'print:block' elements
    const printVisibleElements = containerClone.querySelectorAll('.print\\:block');
    printVisibleElements.forEach(el => {
      el.classList.remove('hidden');
      (el as HTMLElement).style.display = 'block';
    });

    // Also handle print:flex
    const printFlexElements = containerClone.querySelectorAll('.print\\:flex');
    printFlexElements.forEach(el => {
      el.classList.remove('hidden');
      (el as HTMLElement).style.display = 'flex';
    });

    // EXTRA SAFETY: Remove video tags
    const videoTags = containerClone.querySelectorAll('video');
    videoTags.forEach(v => v.remove());

    // CRITICAL FIX: Ensure container expands
    containerClone.style.height = 'auto';
    containerClone.style.overflow = 'visible';
    containerClone.style.maxHeight = 'none';

    // Typography Adjustments & Executive Theme
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      #pdf-stage * { 
        font-family: 'Arial', 'Helvetica', sans-serif !important; 
        text-shadow: none !important; 
        box-shadow: none !important;
        letter-spacing: 0.3px !important;
        line-height: 1.5 !important;
        word-spacing: normal !important;
        white-space: normal !important;
        color: #0f172a !important; /* Force all text dark */
      }
      #pdf-stage { background-color: #ffffff !important; }
      
      /* GENERAL OVERRIDES FOR "EXECUTIVE WHITE" THEME */
      #pdf-stage .bg-slate-900, 
      #pdf-stage .bg-slate-800, 
      #pdf-stage .bg-slate-800\\/50, 
      #pdf-stage .bg-cyber-dark, 
      #pdf-stage .bg-cyber-black,
      #pdf-stage .bg-gradient-to-br { 
        background-color: #ffffff !important; 
        background-image: none !important;
        color: #0f172a !important; 
        border: 1px solid #e2e8f0 !important; /* Slate-200 */
        box-shadow: none !important;
      }

      /* Specific adjustments for contrast */
      #pdf-stage .text-white { color: #0f172a !important; } /* Invert white text to dark slate */
      #pdf-stage .text-slate-300, #pdf-stage .text-slate-400, #pdf-stage .text-slate-500 { color: #475569 !important; } /* Slate-600 */
      
      /* Headers & Accents - Professional Colors */
      #pdf-stage h3, #pdf-stage .text-blue-400, #pdf-stage .text-cyan-400, #pdf-stage .text-cyber-blue { color: #0369a1 !important; } /* Sky-700 */
      #pdf-stage .text-emerald-400, #pdf-stage .text-emerald-500 { color: #15803d !important; } /* Green-700 */
      #pdf-stage .text-red-400, #pdf-stage .text-red-500, #pdf-stage .text-cyber-purple { color: #b91c1c !important; } /* Red-700 */
      
      /* Table Styles */
      #pdf-stage table { width: 100%; border-collapse: collapse; }
      #pdf-stage th { border-bottom: 2px solid #0f172a !important; color: #0f172a !important; font-weight: bold; background-color: #f8fafc !important; }
      #pdf-stage td { border-bottom: 1px solid #e2e8f0 !important; color: #334155 !important; }
      #pdf-stage tr.hover\\:bg-slate-800\\/50 { background-color: transparent !important; } 

      /* Card Headers - Add underline for structure since we removed dark bg */
      #pdf-stage h3 { 
        border-bottom: 2px solid #e2e8f0; 
        padding-bottom: 8px; 
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11pt !important;
        font-weight: 800 !important;
      }

      /* Big Numbers */
      #pdf-stage .text-3xl, #pdf-stage .text-4xl, #pdf-stage .text-xl, #pdf-stage .text-5xl { 
        color: #0f172a !important; 
        font-family: 'Helvetica', 'Arial', sans-serif !important;
        font-weight: 800 !important;
      }
      
      /* Hide unnecessary UI noise */
      #pdf-stage .animate-pulse { animation: none !important; }
      #pdf-stage .backdrop-blur-md { backdrop-filter: none !important; background: white !important; }
      
      /* Layout specific fixes */
      #pdf-stage .grid { display: grid !important; }
      #pdf-stage .flex { display: flex !important; }
      
      /* Force white backgrounds everywhere */
      #pdf-stage div { background-color: transparent; } /* Let main container white shine through unless specific card */
    `;
    containerClone.appendChild(styleSheet);

    // Staging area
    const stage = document.createElement('div');
    stage.id = 'pdf-stage';
    stage.style.position = 'absolute';
    stage.style.left = '-9999px';
    stage.style.top = '0';
    stage.style.width = '800px';
    // Force white background on the stage itself
    stage.style.backgroundColor = '#ffffff';
    stage.appendChild(containerClone); // RESTORED THIS LINE

    document.body.appendChild(stage);

    // INJECT COVER IMAGE (FULL WIDTH)
    let promoBase64 = coverImage;

    const promoWrapper = document.createElement('div');
    promoWrapper.id = 'promo-cover-image';
    promoWrapper.classList.add('space-y-4', 'break-inside-avoid', 'mb-8');
    promoWrapper.style.padding = '0 0px'; // No horizontal padding for full width feel if desired, or keep generic pad

    if (promoBase64) {
      promoWrapper.innerHTML = `
        <div class="flex items-center gap-3 border-l-8 border-indigo-600 pl-4 py-1 mb-4">
            <h4 class="text-xl font-black text-slate-900 uppercase tracking-wider">Digital Factory Twin</h4>
        </div>
        <img src="${promoBase64}" style="width: 100%; height: auto; margin: 0 auto; border-radius: 4px; border: 1px solid #e2e8f0; display: block;" />
        `;

      const header = containerClone.querySelector('.branding-header');
      if (header && header.nextSibling) {
        containerClone.insertBefore(promoWrapper, header.nextSibling);
      } else {
        containerClone.prepend(promoWrapper);
      }
    }

    // 2. ROBUST CONTENT CAPTURE STRATEGY (RECURSIVE SPLITTING)
    // We want to avoid capturing huge blocks that overflow a page.
    // We will recursively walk down the tree. If a block fits on "a page" (approx 1000px height for 800px width), we keep it.
    // If it's too big, we split its children.

    // Page height in PX equivalent for our 800px width stage
    // Letter aspect ratio is ~1.294 (215.9 x 279.4 mm)
    // 800px width -> ~1035px height. Let's use 900px as a safe "chunk" max height to allow for margins.
    const SAFE_CHUNK_HEIGHT = 900;

    const getSplitBlocks = (element: HTMLElement): HTMLElement[] => {
      // If it's a leaf node or small enough, return it
      // Also check if it's an image - images are atomic, we can't split them further (unless we crop, but that's complex)
      const isAtomic = element.tagName === 'IMG' || element.tagName === 'SVG' || element.tagName === 'TABLE';
      // If it has no children, it is atomic
      if (element.children.length === 0) return [element];

      // Measure height
      const height = element.offsetHeight;

      // If fits safely or is atomic, return as one block
      if (height <= SAFE_CHUNK_HEIGHT || isAtomic) {
        return [element];
      }

      // If too big, decompose into children
      let chunks: HTMLElement[] = [];
      const children = Array.from(element.children) as HTMLElement[];

      if (children.length === 0) return [element]; // Safety

      for (const child of children) {
        // Recursively get blocks from children
        chunks.push(...getSplitBlocks(child));
      }

      return chunks;
    };

    // Initial pass: Get top level children of container
    const initialChildren = Array.from(containerClone.children) as HTMLElement[];
    let simpleBlocks: HTMLElement[] = [];

    // First, filter out non-content
    for (const child of initialChildren) {
      if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') continue;
      // We start with the high level blocks.
      simpleBlocks.push(child);
    }

    // Now refine them recursively
    let finalCaptureBlocks: HTMLElement[] = [];
    for (const block of simpleBlocks) {
      finalCaptureBlocks.push(...getSplitBlocks(block));
    }

    // Remove empty blocks
    finalCaptureBlocks = finalCaptureBlocks.filter(b => b.offsetHeight > 0 && b.innerText.trim().length > 0 || b.querySelector('img') || b.querySelector('svg'));

    // Deduplicate if needed (though recursive logic shouldn't duplicate)
    const uniqueBlocks = [...new Set(finalCaptureBlocks)];


    // 3. Initialize PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = 20;

    // Helper to add new page
    const addNewPage = () => {
      pdf.addPage();
      currentY = 20;
    };

    // 4. Capture and Add Blocks
    for (const block of uniqueBlocks) {
      if (!block) continue;

      const canvas = await html2canvas(block, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });

      const imgData = canvas.toDataURL('image/png');
      const cssWidth = canvas.width / 2;
      const cssHeight = canvas.height / 2;

      const pxToMmScale = contentWidth / 800;

      const pdfImgWidth = cssWidth * pxToMmScale;
      let pdfImgHeight = cssHeight * pxToMmScale;

      if (pdfImgHeight <= 0) continue;

      const footerHeight = 25;
      const maxContentY = pageHeight - footerHeight;

      // If this specific atomic block is huge (larger than a full page), we have to scale it to fit or just print it.
      // Prioritize fitting on page if it's an image.
      if (pdfImgHeight > (maxContentY - margin)) {
        // It's a huge block. Start a new page if we aren't at top.
        if (currentY > 20) addNewPage();

        // If it's still too big, scale it to fit (mostly for big images)
        if (pdfImgHeight > (maxContentY - 20)) {
          const ratio = (maxContentY - 20) / pdfImgHeight;
          // Only scale height if we want to distort? No.
          // Better to constrain width/height maintaining aspect ratio
          // But usually width is fixed. So let's just let it flow or clip? 
          // In a simple generic report, scaling it to fit one page is often safer for "charts/images"
          if (block.tagName === 'IMG' || block.querySelector('img')) {
            const fitHeight = maxContentY - 20;
            const fitWidth = pdfImgWidth * ratio; // usage ratio
            // Actually we want to fit height, so width might shrink
            // pdfImgWidth = pdfImgWidth * ratio; 
            // pdfImgHeight = fitHeight;
            // But wait, cssWidth is 800px fixed context.
            // Let's just constrain.
            const scaleFactor = (maxContentY - 20) / pdfImgHeight;
            pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth * scaleFactor, pdfImgHeight * scaleFactor);
            currentY += (pdfImgHeight * scaleFactor) + 5;
            continue;
          }
        }
      }

      if (currentY + pdfImgHeight > maxContentY) {
        addNewPage();
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight);
      currentY += pdfImgHeight + 5;

      // FORCE PAGE BREAK AFTER COVER IMAGE
      if (block.id === 'promo-cover-image') {
        addNewPage();
      }
    }

    // Add Page Numbers & Branding
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100);

      const footerY = pageHeight - 12;

      // Right side: Page number
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

      // Left side: Branding
      pdf.text(`${companyName} | www.ia-agus.com`, margin, footerY);

      // Center: Confidentiality Warning
      pdf.setTextColor(185, 28, 28);
      pdf.setFont('helvetica', 'bold');
      pdf.text("CONFIDENTIAL DOCUMENT", pageWidth / 2, footerY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
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
export const exportLineBalancingToPDF = async (
  stations: Array<{ id: string; name: string; operations: Array<{ name: string; code: string; time: number }> }>,
  targetCycleTime: number,
  garmentType: string
) => {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const settings = getSettings();
  const companyName = 'MANUFACTURA IA PRO';
  let companyLogo = settings?.companyLogo || '';

  // PRE-FETCH BLUE LOGO (override default)
  try {
    const logoResponse = await fetch('/ia-agus-blue.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      companyLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (e) {
    console.warn("Failed to load blue logo", e);
  }

  // Header (LIGHT THEME - Print Friendly)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 32, pageWidth - margin, 32);

  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', margin, 8, 16, 16);
      pdf.text(companyName, margin + 20, 19);
    } catch (e) {
      pdf.text(companyName, margin, 18);
    }
  } else {
    pdf.text(companyName, margin, 18);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('www.ia-agus.com', margin, 38);
  pdf.text('Production Analysis Report', margin, 43);

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LINE BALANCING ANALYSIS', margin, 60);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Operation Type: \${garmentType}`, margin, 74);
  pdf.text(`Target Cycle Time: \${formatNum(targetCycleTime, 2)} min`, margin, 80);

  // Station Summary Table
  let yPos = 94;

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

    pdf.text(`Station \${index + 1}`, margin + 3, yPos + 5);
    pdf.text(`\${formatNum(station.operations.length)} ops`, margin + 40, yPos + 5);
    pdf.text(`\${formatNum(cycleTime, 2)} min`, margin + 120, yPos + 5);

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
    pdf.text(`\${station.name}:`, margin, yPos);
    yPos += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    station.operations.forEach((op) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`• \${op.name} (\${op.code}) - \${op.time.toFixed(2)} min`, margin + 5, yPos);
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
    pdf.text(`\${companyName} | Page \${i} of \${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Set document property for the viewer title
  pdf.setProperties({
    title: `Line Balancing - \${garmentType} - IA.AGUS`
  });

  // Download with specific filename
  const fileName = `Line Balancing - \${garmentType} - IA.AGUS.pdf`;
  pdf.save(fileName);
};

// Export Regional Comparison to PDF
export const exportRegionalComparisonToPDF = async (
  countries: Array<{ name: string; flag: string; hourlyWage: number; overhead: number; productivity: number; costPerPiece: number }>,
  sam: number,
  garmentName: string = 'General',
  mode: string = 'textile'
) => {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const settings = getSettings();
  const companyName = 'MANUFACTURA IA PRO';

  // PRE-FETCH BLUE LOGO (override default)
  let companyLogo = settings?.companyLogo || '';
  try {
    const logoResponse = await fetch('/ia-agus-blue.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      companyLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (e) {
    console.warn("Failed to load blue logo", e);
  }

  // Header (LIGHT THEME - Print Friendly)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 32, pageWidth - margin, 32);

  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', margin, 8, 16, 16);
      pdf.text(companyName, margin + 20, 19);
    } catch (e) {
      pdf.text(companyName, margin, 18);
    }
  } else {
    pdf.text(companyName, margin, 18);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('www.ia-agus.com', margin, 38);
  pdf.text('Regional Cost Analysis', margin, 43);

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REGIONAL COST COMPARISON', margin, 60);

  // Industry-specific label
  const industryLabels: Record<string, string> = {
    automotive: 'Operation',
    aerospace: 'Component',
    electronics: 'Assembly',
    textile: 'Garment',
    footwear: 'Footwear Style',
    pharmaceutical: 'Medicine',
    food: 'Product',
    metalworking: 'Part'
  };
  const industryLabel = industryLabels[mode] || 'Operation';

  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`\${industryLabel}: \${garmentName}`, margin, 74);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Standard SAM: \${formatNum(sam, 1)} minutes`, margin, 80);
  pdf.text(`Total Countries Analyzed: \${formatNum(countries.length)}`, margin, 86);

  // Sort countries by cost
  const sorted = [...countries].sort((a, b) => a.costPerPiece - b.costPerPiece);

  // Most competitive
  let yPos = 98;
  pdf.setFillColor(220, 255, 220);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 128, 0);
  pdf.text('[ MOST COMPETITIVE ]', margin + 3, yPos + 7);
  pdf.setFontSize(14);
  pdf.text(`\${sorted[0].name} - \${formatUSD(sorted[0].costPerPiece, 4)}/piece`, margin + 3, yPos + 15);
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
    pdf.text(`\${country.name}`, margin + 2, yPos + 4);
    pdf.text(`\${formatUSD(country.hourlyWage)}`, margin + 50, yPos + 4);
    pdf.text(`\${formatNum(country.overhead)}%`, margin + 80, yPos + 4);
    pdf.text(`\${formatNum(country.productivity)}%`, margin + 115, yPos + 4);

    // Highlight competitive prices
    if (index === 0) {
      pdf.setTextColor(0, 128, 0);
      pdf.setFont('helvetica', 'bold');
    }
    pdf.text(`\${formatUSD(country.costPerPiece, 4)}`, margin + 155, yPos + 4);
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
  pdf.text(`• Average cost per piece: \${formatUSD(avgCost, 4)}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`• Cost range: \${formatUSD(cheapestCost, 4)} - \${formatUSD(mostExpensive, 4)}`, margin + 5, yPos);
  yPos += 7;
  pdf.text(`• Potential savings: \${formatNum(savings, 1)}% (choosing \${sorted[0].name} vs \${sorted[sorted.length - 1].name})`, margin + 5, yPos);

  // Add Chart Section
  yPos += 15;
  if (yPos > pageHeight - 120) {
    pdf.addPage();
    yPos = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Cost Ranking Chart', margin, yPos);
  yPos += 8;

  // Draw horizontal bar chart
  const chartHeight = Math.min(sorted.length * 8, 100); // 8mm per bar, max 100mm
  const chartWidth = pageWidth - 2 * margin - 60; // Leave space for labels
  const maxCost = sorted[sorted.length - 1].costPerPiece;
  const barHeight = Math.min(6, chartHeight / sorted.length - 1); // Bar height with spacing

  sorted.forEach((country, index) => {
    const yBar = yPos + (index * (barHeight + 1));

    // Check if we need a new page
    if (yBar > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
      return; // Skip this bar on current page, will be drawn on new page
    }

    // Country name on the left
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(country.name, margin, yBar + barHeight / 2 + 1, { align: 'left' });

    // Calculate bar width
    const barWidth = (country.costPerPiece / maxCost) * chartWidth;
    const barX = margin + 50;

    // Draw bar - green for cheapest, blue for others
    if (index === 0) {
      pdf.setFillColor(16, 185, 129); // Green
    } else {
      pdf.setFillColor(0, 212, 255); // Cyan blue
    }
    pdf.rect(barX, yBar, barWidth, barHeight, 'F');

    // Cost label at end of bar
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(formatUSD(country.costPerPiece, 3), barX + barWidth + 2, yBar + barHeight / 2 + 1);
  });

  yPos += chartHeight + 10;

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('IA.AGUS Engineering Labs | Regional Cost Analysis', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Set document property for the viewer title
  pdf.setProperties({
    title: `Regional Cost Comparison - \${garmentName} - IA.AGUS`
  });

  // Download with specific filename
  const fileName = `Regional Cost Comparison - \${garmentName} - IA.AGUS.pdf`;
  pdf.save(fileName);
};

// Export Costing Analysis to PDF (Light Theme - Print Friendly)
export const exportCostingToPDF = async (
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
  pdf.line(margin, 32, pageWidth - margin, 32);

  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const settings = getSettings();
  const companyName = 'MANUFACTURA IA PRO';
  let companyLogo = settings?.companyLogo || '';

  // PRE-FETCH BLUE LOGO (override default)
  try {
    const logoResponse = await fetch('/ia-agus-blue.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      companyLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (e) {
    console.warn("Failed to load blue logo", e);
  }

  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', margin, 8, 16, 16);
      pdf.text(companyName, margin + 20, 19);
    } catch (e) {
      pdf.text(companyName, margin, 18);
    }
  } else {
    pdf.text(companyName, margin, 18);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('www.ia-agus.com', margin, 38);
  pdf.text('Financial Engineering Report', margin, 43);

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COSTING ANALYSIS', margin, 60);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date().toLocaleDateString(), margin, 74);

  // Input Parameters
  let yPos = 88;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Input Parameters', margin, yPos);
  yPos += 10;

  const costPerMinute = (hourlyWage / 60) / (efficiency / 100);
  const laborCost = sam * costPerMinute;
  const totalCost = laborCost * (1 + overhead / 100);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`SAM (Standard Allowed Minutes): \${formatNum(sam)}`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Hourly Wage: \${formatUSD(hourlyWage)} USD`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Line Efficiency: \${formatNum(efficiency)}%`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Overhead: \${formatNum(overhead)}%`, margin + 5, yPos);
  yPos += 14;

  // Calculations
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cost Breakdown', margin, yPos);
  yPos += 10;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  yPos += 8;
  pdf.text(`Cost per Minute (effective): \${formatUSD(costPerMinute, 4)}`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Direct Labor Cost: \${formatUSD(laborCost, 4)}`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Overhead (+\${formatNum(overhead)}%): \${formatUSD(laborCost * (overhead / 100), 4)}`, margin + 5, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Total Cost per Piece: \${formatUSD(totalCost, 4)}`, margin + 5, yPos);
  yPos += 18;

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
  pdf.text(`Available Minutes/Day: \${formatNum(availableMinutes)} min`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Production Capacity: \${formatNum(piecesPerDay)} pieces/day`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Daily Revenue Potential (3x markup): \${formatUSD(dailyRevenue)}`, margin + 5, yPos);
  yPos += 8;
  pdf.text(`Monthly Revenue Potential: \${formatUSD(dailyRevenue * 22)}`, margin + 5, yPos);

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

// Export Chat History to PDF
export const exportChatToPDF = (
  messages: Array<{ role: 'user' | 'ai'; content: string }>,
  mode: string = 'Industrial Analysis'
) => {
  const settings = getSettings();
  const companyName = settings?.companyName || "IA.AGUS";

  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  // Header (Executive White Theme)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 25, pageWidth - margin, 25);

  const companyLogo = settings?.companyLogo || '';
  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', margin, 10, 16, 16);
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companyName, margin + 20, 21);
    } catch (e) {
      pdf.setFontSize(18);
      pdf.text(companyName, margin, 18);
    }
  } else {
    pdf.setFontSize(18);
    pdf.text(companyName, margin, 18);
  }

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // Slate-500
  pdf.text('Manufactura IA Pro - Technical Consultation', margin, 34);
  pdf.text(new Date().toLocaleString(), pageWidth - margin, 34, { align: 'right' });

  let yPos = 50;
  const bottomThreshold = pageHeight - 30; // Safety Zone for Footer

  messages.forEach((msg) => {
    // 1. Initial Page Check
    if (yPos > bottomThreshold) {
      pdf.addPage();
      yPos = 20;
    }

    const isUser = msg.role === 'user';
    const roleName = isUser ? 'YOU (Engineer)' : 'AI SYSTEM';
    // Style settings
    const bubbleColor = isUser ? [240, 249, 255] : [248, 250, 252];
    const borderColor = isUser ? [186, 230, 253] : [226, 232, 240];
    const textColor = isUser ? [12, 74, 110] : [15, 23, 42];

    // Draw Role Name
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text(roleName, margin, yPos);
    yPos += 5;

    // 2. Prepare Text
    const contentText = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Width & Margins
    const maxWidth = pageWidth - (margin * 2) - 15;
    const splitText = pdf.splitTextToSize(contentText, maxWidth);

    const lineHeight = 5;
    const padding = 6;

    // 3. Multi-page Content Loop
    // We process the text line by line to determine where to break
    let currentLineIndex = 0;

    while (currentLineIndex < splitText.length) {
      // Calculate how much space we have left on this page
      const spaceRemaining = bottomThreshold - yPos - padding; // check padding buffer

      // Calculate how many lines we can fit in this space
      const linesThatFit = Math.floor(spaceRemaining / lineHeight);

      // If we can't fit even one line (plus padding), force new page immediately
      if (linesThatFit <= 0) {
        pdf.addPage();
        yPos = 20;
        continue; // Retry loop on new page
      }

      // Determine lines for this chunk
      const linesForThisPage = Math.min(linesThatFit, splitText.length - currentLineIndex);
      const chunkText = splitText.slice(currentLineIndex, currentLineIndex + linesForThisPage);
      const chunkHeight = linesForThisPage * lineHeight;

      // Draw Bubble Background for this chunk
      pdf.setFillColor(bubbleColor[0], bubbleColor[1], bubbleColor[2]);
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      // Note: we draw the rect slightly larger than text
      pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), chunkHeight + (padding * 2), 2, 2, 'FD');

      // Draw Text Chunk
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(chunkText, margin + 8, yPos + padding + 4); // +4 vertical adjust for baseline

      // Update indices
      currentLineIndex += linesForThisPage;
      yPos += chunkHeight + (padding * 2);

      // Add a small gap between chunks if we are continuing on same message (rare case of exact fit)
      // or if we are moving to next page (handled by loop start)

      // If we still have lines left, we MUST add a page because we filled this one
      if (currentLineIndex < splitText.length) {
        pdf.addPage();
        yPos = 20;
      }
    }

    yPos += 8; // Spacing between distinct messages
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100);

    // Right: Page X of Y
    pdf.text(`Page \${i} of \${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Left: Branding
    pdf.text(`\${companyName} | www.ia-agus.com`, margin, pageHeight - 10);

    // Center: Confidential
    pdf.setTextColor(185, 28, 28);
    pdf.setFont('helvetica', 'bold');
    pdf.text("CONFIDENTIAL DOCUMENT", pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
  }

  pdf.save(`AI-Consultation-\${new Date().getTime()}.pdf`);
};

// Export Executive Summary to PDF
export const exportExecutiveSummaryToPDF = async (
  metrics: {
    oee: number;
    output: number;
    defectRate: number;
    cycleTime: number;
    laborEfficiency: number;
    qualityScore: number;
    projectedOutput: number;
    probabilityOfFailure: number;
    trends: {
      oee: number;
      quality: number;
    };
  },

  industrialMode: string,
  chartImages?: string[] // Array of Base64 chart captures
) => {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const settings = getSettings();
  const companyName = 'MANUFACTURA IA PRO';
  let companyLogo = settings?.companyLogo || '';

  // PRE-FETCH BLUE LOGO (override default)
  try {
    const logoResponse = await fetch('/ia-agus-blue.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      companyLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (e) {
    console.warn("Failed to load blue logo", e);
  }

  // Header (LIGHT THEME - Executive)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 32, pageWidth - margin, 32);

  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', margin, 8, 16, 16);
      pdf.text(companyName, margin + 20, 19);
    } catch (e) {
      pdf.text(companyName, margin, 18);
    }
  } else {
    pdf.text(companyName, margin, 18);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('www.ia-agus.com', margin, 38);
  pdf.text('Executive Management Report', margin, 43);

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXECUTIVE DASHBOARD SUMMARY', margin, 60);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Industry Mode: \${industrialMode.toUpperCase()}`, margin, 74);
  pdf.text(`Generated: \${new Date().toLocaleString()}`, margin, 80);

  // Section 1: Primary KPIs
  let yPos = 94;
  pdf.setFillColor(240, 244, 248); // Slate-100
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 24, 'F');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Overall Equipment Effectiveness (OEE)', margin + 5, yPos + 8);

  pdf.setFontSize(24);
  pdf.setTextColor(metrics.trends.oee >= 0 ? 22 : 220, metrics.trends.oee >= 0 ? 163 : 38, metrics.trends.oee >= 0 ? 74 : 38); // Green-600 or Red-600
  pdf.text(`\${metrics.oee.toFixed(1)}%`, margin + 5, yPos + 18);

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(metrics.trends.oee >= 0 ? '(+) Positive Trend' : '(-) Negative Trend', margin + 50, yPos + 18);

  // Output & Defects (Side by Side)
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total Output: \${formatNum(metrics.output)} pcs`, margin + 100, yPos + 8);
  pdf.text(`Defect Rate: \${metrics.defectRate.toFixed(2)}%`, margin + 100, yPos + 18);

  yPos += 35;

  // Section 2: Operational Health
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Operational Health', margin, yPos);
  pdf.setLineWidth(0.2);
  pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 15;

  const kpis = [
    { label: 'Avg Cycle Time', value: `\${metrics.cycleTime.toFixed(1)}s`, desc: 'Live Pacing' },
    { label: 'Labor Efficiency', value: `\${metrics.laborEfficiency.toFixed(1)}%`, desc: 'Performance Based' },
    { label: 'Quality Score', value: `\${metrics.qualityScore.toFixed(1)}/10`, desc: metrics.qualityScore > 7 ? 'Good' : 'Needs Attention' }
  ];

  kpis.forEach((kpi, index) => {
    const xOffset = margin + (index * 60);
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(kpi.label, xOffset, yPos);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(kpi.value, xOffset, yPos + 8);
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    pdf.text(kpi.desc, xOffset, yPos + 14);
  });

  yPos += 25;

  // Section 3: Predictive AI Insights
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('AI Predictive Insights', margin, yPos);
  pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 15;

  // Projected Output Box
  pdf.setDrawColor(3, 169, 244); // Light Blue
  pdf.setFillColor(240, 253, 255); // Azure-50
  pdf.rect(margin, yPos, 85, 30, 'FD');

  pdf.setFontSize(10);
  pdf.setTextColor(2, 132, 199); // Sky-600
  pdf.text('PROJECTED OUTPUT (1H)', margin + 5, yPos + 8);
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`\${metrics.projectedOutput} pcs`, margin + 5, yPos + 20);

  // Risk Box
  const isHighRisk = metrics.probabilityOfFailure > 15;
  pdf.setFillColor(isHighRisk ? 254 : 240, isHighRisk ? 242 : 253, isHighRisk ? 242 : 244);
  pdf.setDrawColor(isHighRisk ? 239 : 34, isHighRisk ? 68 : 197, isHighRisk ? 68 : 94);
  pdf.rect(margin + 90, yPos, 85, 30, 'FD');

  pdf.setFontSize(10);
  pdf.setTextColor(isHighRisk ? 220 : 21, isHighRisk ? 38 : 128, isHighRisk ? 38 : 61); // Red-600 or Green-600
  pdf.text('SYSTEM FAILURE PROBABILITY', margin + 95, yPos + 8);
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`\${metrics.probabilityOfFailure.toFixed(1)}%`, margin + 95, yPos + 20);
  pdf.setFontSize(9);
  pdf.text(isHighRisk ? 'HIGH RISK DETECTED' : 'System Stable', margin + 95, yPos + 26);

  // OPTIONAL: Chart Images (New Page)
  if (chartImages && chartImages.length > 0) {
    pdf.addPage();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('PERFORMANCE VISUALIZATION', margin, 20);

    let chartY = 30;
    chartImages.forEach((imgData, idx) => {
      if (chartY > pageHeight - 80) {
        pdf.addPage();
        chartY = 20;
      }

      // Fit 2 charts per page nicely
      const imgHeight = 80;
      const imgWidth = pageWidth - (margin * 2);

      pdf.addImage(imgData, 'PNG', margin, chartY, imgWidth, imgHeight);

      // Add label
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const labels = ['Production Volume', 'Cost Analysis', 'Quality Scatter Plot'];
      pdf.text(labels[idx] || `Chart \${idx + 1}`, margin, chartY - 2);

      chartY += imgHeight + 15;
    });
  }

  yPos += 40;

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`\${companyName} Executive Report | Page \${i} of \${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Set properties
  pdf.setProperties({
    title: `Executive Dashboard - \${industrialMode} - \${companyName}`
  });

  pdf.save(`Executive_Report_\${industrialMode}_\${new Date().toISOString().split('T')[0]}.pdf`);
};