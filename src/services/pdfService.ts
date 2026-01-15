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

export const exportToPDF = async (elementId: string, fileName: string = "Reporte-Ingenieria.pdf", coverImage?: string | null) => {
  const settings = getSettings();
  const companyName = settings?.companyName || "IA.AGUS";

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

    // Typography Adjustments & Executive Theme
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      #pdf-stage * { font-family: 'Helvetica', 'Arial', sans-serif !important; text-shadow: none !important; box-shadow: none !important; }
      #pdf-stage { color: #1e293b !important; } /* Slate-800 */
      
      /* GENERAL OVERRIDES FOR "EXECUTIVE WHITE" THEME */
      #pdf-stage .bg-slate-900, 
      #pdf-stage .bg-slate-800, 
      #pdf-stage .bg-slate-800\\/50, 
      #pdf-stage .bg-cyber-dark, 
      #pdf-stage .bg-cyber-black { 
        background-color: #ffffff !important; 
        color: #0f172a !important; 
        border: 1px solid #e2e8f0 !important; /* Slate-200 */
        box-shadow: none !important;
      }

      /* Specific adjustments for contrast */
      #pdf-stage .text-white { color: #0f172a !important; } /* Invert white text to dark slate */
      #pdf-stage .text-slate-300, #pdf-stage .text-slate-400, #pdf-stage .text-slate-500 { color: #475569 !important; } /* Slate-600 */
      
      /* Headers & Accents - Professional Colors */
      #pdf-stage h3, #pdf-stage .text-blue-400, #pdf-stage .text-cyan-400 { color: #0369a1 !important; } /* Sky-700 */
      #pdf-stage .text-emerald-400, #pdf-stage .text-emerald-500 { color: #15803d !important; } /* Green-700 */
      #pdf-stage .text-red-400, #pdf-stage .text-red-500 { color: #b91c1c !important; } /* Red-700 */
      #pdf-stage .text-purple-400, #pdf-stage .text-purple-500 { color: #7e22ce !important; } /* Purple-700 */
      #pdf-stage .text-pink-400, #pdf-stage .text-pink-500 { color: #be185d !important; } /* Pink-700 */
      #pdf-stage .text-orange-400, #pdf-stage .text-orange-500 { color: #c2410c !important; } /* Orange-700 */
      #pdf-stage .text-yellow-400 { color: #b45309 !important; } /* Amber-700 */

      /* Table Styles */
      #pdf-stage table { width: 100%; border-collapse: collapse; }
      #pdf-stage th { border-bottom: 2px solid #0f172a !important; color: #0f172a !important; font-weight: bold; background-color: #f8fafc !important; }
      #pdf-stage td { border-bottom: 1px solid #e2e8f0 !important; color: #334155 !important; }
      #pdf-stage tr.hover\\:bg-slate-800\\/50 { background-color: transparent !important; } 

      /* Bar Charts */
      #pdf-stage .bg-emerald-500 { background-color: #22c55e !important; } /* Keep vibrant but distinguishable */
      #pdf-stage .bg-red-400 { background-color: #f87171 !important; }
      
      /* Card Headers - Add underline for structure since we removed dark bg */
      #pdf-stage h3 { 
        border-bottom: 2px solid #e2e8f0; 
        padding-bottom: 8px; 
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11pt !important;
      }

      /* Big Numbers */
      #pdf-stage .text-3xl, #pdf-stage .text-4xl, #pdf-stage .text-xl { 
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

    // INJECT COVER IMAGE (Robust Method)
    // Priority: User Provided Image > Default Promo > None
    let promoBase64 = coverImage;

    // Only fetch if it's NOT a data URI (passed by user) and appears to be a local path
    if (promoBase64 && !promoBase64.startsWith('data:') && !promoBase64.startsWith('http')) {
      try {
        const promoResponse = await fetch('/ia_agus_hub_launch_promo.png');
        if (promoResponse.ok) {
          const promoBlob = await promoResponse.blob();
          promoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(promoBlob);
          });
        }
      } catch (err) {
        console.warn("Failed to pre-fetch promo image:", err);
      }
    }

    const promoWrapper = document.createElement('div');
    promoWrapper.id = 'promo-cover-image';
    promoWrapper.classList.add('space-y-4', 'break-inside-avoid', 'mb-8');
    promoWrapper.style.padding = '0 20px';

    // Use the pre-calculated Base64 (or fallback path) directly
    if (promoBase64) {
      promoWrapper.innerHTML = `
        <div class="flex items-center gap-3 border-l-8 border-indigo-600 pl-4 py-1">
            <h4 class="text-xl font-black text-slate-900 uppercase tracking-wider">Digital Factory Twin</h4>
        </div>
        <img src="${promoBase64}" style="width: 100%; border-radius: 12px; border: 2px solid #e2e8f0; display: block; margin-top: 1rem; min-height: 200px; object-fit: cover;" />
        `;

      // Insert it after the branding header
      const header = containerClone.querySelector('.branding-header');
      if (header && header.nextSibling) {
        containerClone.insertBefore(promoWrapper, header.nextSibling);
      } else {
        containerClone.prepend(promoWrapper);
      }
    }

    // 2. ROBUST CONTENT CAPTURE STRATEGY
    // Instead of looking for specific classes ("Legacy" vs "Dashboard"), we iterate ALL top-level children.
    // This ensures we capture everything visible in the container.
    const captureBlocks: HTMLElement[] = [];
    const children = Array.from(containerClone.children) as HTMLElement[];

    for (const child of children) {
      if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') continue;

      // Special Handling for the "Big Text Wrapper" in Legacy Mode
      // We want to split this into smaller chunks so page breaks work nicely
      if (child.classList.contains('space-y-16')) {
        const findAtomicBlocks = (element: HTMLElement): HTMLElement[] => {
          const blocks: HTMLElement[] = [];
          const grandChildren = Array.from(element.children) as HTMLElement[];

          if (grandChildren.length === 0) {
            if (element.innerText.trim().length > 0) return [element];
            return [];
          }

          for (const gc of grandChildren) {
            // If the grandchild is itself a big wrapper/section, recurse
            if (gc.classList.contains('page-break-section') || gc.classList.contains('space-y-8')) {
              blocks.push(...findAtomicBlocks(gc));
            }
            // If it's a decent sized block (Analysis Section, H3, P, etc), take it
            else if (['H1', 'H2', 'H3', 'H4', 'P', 'IMG', 'UL', 'OL'].includes(gc.tagName)) {
              blocks.push(gc);
            }
            // Flex/Grid containers that are atomic
            else if ((gc.classList.contains('flex') || gc.classList.contains('grid')) && !gc.classList.contains('space-y-16')) {
              blocks.push(gc);
            }
            // Otherwise, recurse deeper
            else {
              blocks.push(...findAtomicBlocks(gc));
            }
          }
          return blocks;
        };
        captureBlocks.push(...findAtomicBlocks(child));
      }
      // Special: The "Dashboard" wrapper in new mode (usually first child with space-y-8)
      // Check if this child ITSELF is a huge container like the dashboard wrapper
      // Relaxed condition: >= 2 children to match standard dashboard (Executive + Cycle + Time = 3 sections usually)
      else if (child.children.length >= 2 && child.innerText.length > 200 && !child.id.includes('promo')) {
        // It's likely a big wrapper (like the dashboard root). Treat its children as blocks
        const subSections = Array.from(child.children) as HTMLElement[];
        for (const sub of subSections) {
          captureBlocks.push(sub);
        }
      }
      else {
        // Default: Capture the child as a whole (Headers, Title Bars, Promo Image, Footer)
        // Only if it has visual content
        if (child.innerText.trim().length > 0 || child.querySelector('img') || child.querySelector('svg') || child.offsetHeight > 0) {
          captureBlocks.push(child);
        }
      }
    }

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
        allowTaint: true, // Allow cross-origin images
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

      // STRICTER PAGE LIMIT: Account for Footer Height (approx 25mm) to prevent overlap/empalme
      const footerHeight = 25;
      const effectivePageLimit = pageHeight - margin - safetyBuffer - footerHeight;

      // Check if we need a new page
      // Add a small 5mm buffer to the height check itself for component variance
      if (currentY + pdfImgHeight + 5 > effectivePageLimit) {
        addNewPage();
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight);
      currentY += pdfImgHeight + 3; // Vertical spacing
    }

    // Add Page Numbers & Branding
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100); // Slate-500

      // Right side: Page number
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

      // Left side: Branding
      pdf.text("IA.AGUS | www.ia-agus.com", margin, pageHeight - 10);

      // Center: Confidentiality Warning
      pdf.setTextColor(185, 28, 28); // Red-700
      pdf.setFont('helvetica', 'bold');
      pdf.text("CONFIDENTIAL DOCUMENT", pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.setFont('helvetica', 'normal'); // Reset font formatting for safety

      // HEADERS (Added per request)
      // Only for pages > 1 or all pages? Usually requested on all.
      // We'll put it at the top margin (e.g. y=15)
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0); // Black
      pdf.setFont('helvetica', 'bold');
      pdf.text("MANUFACTURA IA PRO", pageWidth / 2, 15, { align: 'center' });

      // Reset for next iterations just in case
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

  // Industry-specific label
  const industryLabels: Record<string, string> = {
    automotive: 'Operation',
    aerospace: 'Component',
    electronics: 'Assembly',
    textile: 'Garment'
  };
  const industryLabel = industryLabels[mode] || 'Operation';

  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`${industryLabel}: ${garmentName}`, margin, 50);

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

  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42); // Slate-900
  pdf.setFont('helvetica', 'bold');
  pdf.text('MANUFACTURA IA PRO', margin, 15);

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // Slate-500
  pdf.text('Technical Consultation Log', margin, 20);
  pdf.text(new Date().toLocaleString(), pageWidth - margin, 20, { align: 'right' });

  let yPos = 35;
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
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Left: IA.AGUS | website
    pdf.text("IA.AGUS | www.ia-agus.com", margin, pageHeight - 10);

    // Center: Confidential
    pdf.setTextColor(185, 28, 28);
    pdf.setFont('helvetica', 'bold');
    pdf.text("CONFIDENTIAL DOCUMENT", pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
  }

  pdf.save(`AI-Consultation-${new Date().getTime()}.pdf`);
};