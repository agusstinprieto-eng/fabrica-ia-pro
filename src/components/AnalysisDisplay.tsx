
import React from 'react';
import { FileData, IndustrialAnalysis } from '../types';
import { EngineeringDashboard } from './EngineeringDashboard';
import { ConsensusResult, SAMValidation } from '../services/consensusService';
import { VideoLabDisplay } from './VideoLabDisplay';

interface AnalysisDisplayProps {
  content: string;
  images?: FileData[];
  layoutVisualization?: string | null;
  videoUrl?: string | null;
  methodAnalysis?: any;
  isImprovingMethod?: boolean;
  onImproveMethod?: () => void;
  consensusData?: ConsensusResult | null;
  samValidation?: SAMValidation | null;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ content, images, layoutVisualization, videoUrl, methodAnalysis, isImprovingMethod, onImproveMethod, consensusData, samValidation }) => {
  // Dynamic Branding from Settings
  const [branding, setBranding] = React.useState({ name: 'IA.AGUS', logo: '', labs: 'Agustín Prieto. Engineering Labs.' });

  React.useEffect(() => {
    const stored = localStorage.getItem('costura-ia-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        setBranding({
          name: settings.companyName || 'IA.AGUS',
          logo: settings.companyLogo || '',
          labs: settings.companyName ? `${settings.companyName} Industrial Labs` : 'Agustín Prieto. Engineering Labs.'
        });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  if (!content) return null;

  const selectedImages = images?.filter(img => img.selected !== false).slice(0, 6) || [];

  // Try to parse as JSON for the new Engineering Dashboard
  let engineeringData: IndustrialAnalysis | null = null;

  if (typeof content === 'object' && content !== null) {
    engineeringData = content as unknown as IndustrialAnalysis;
  } else if (typeof content === 'string' && content.trim() !== '') {
    try {
      // Basic cleanup in case Gemini wraps it in markdown blocks
      let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

      // More robust extraction: find first '{' and last '}'
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(cleanContent);
        // Check if it's an error object or a valid analysis
        if (parsed.error) {
          console.error("Analysis Error:", parsed.error);
        } else {
          engineeringData = parsed;
        }
      }
    } catch (e) {
      console.log("Not strict JSON, falling back to legacy view.");
    }
  }

  // ── Confidence Badge Component ──
  const ConfidenceBadge = () => {
    if (!consensusData || consensusData.passCount < 2) return null;

    const score = consensusData.confidenceScore;
    const color = score >= 85 ? 'emerald' : score >= 65 ? 'amber' : 'red';
    const ringColor = {
      emerald: 'ring-emerald-400/50 text-emerald-400 bg-emerald-400/10',
      amber: 'ring-amber-400/50 text-amber-400 bg-amber-400/10',
      red: 'ring-red-400/50 text-red-400 bg-red-400/10'
    }[color];

    return (
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm print:bg-slate-50 print:border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Confidence Score */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-2 ${ringColor} font-black text-sm`}>
            <span className="text-lg">📊</span>
            <span>Confidence: {score}%</span>
          </div>

          {/* Pass Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-400/10 text-blue-400 ring-2 ring-blue-400/30 font-bold text-xs">
            <span>🔄</span>
            <span>{consensusData.passCount} analysis passes (median)</span>
          </div>

          {/* Variance */}
          {consensusData.variancePct > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-400/10 text-purple-400 ring-2 ring-purple-400/30 font-bold text-xs">
              <span>Δ</span>
              <span>±{consensusData.variancePct}% variance</span>
            </div>
          )}

          {/* SAM Validation */}
          {samValidation && samValidation.status !== 'no_match' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs ${samValidation.status === 'validated'
                ? 'bg-emerald-400/10 text-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/30'
              }`}>
              <span>{samValidation.status === 'validated' ? '✅' : '⚠️'}</span>
              <span>{samValidation.message}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If valid structured data, render the Dashboard
  if (engineeringData) {
    if (videoUrl) {
      return (
        <div id="analysis-report-container" className="max-w-full">
          <ConfidenceBadge />
          <VideoLabDisplay
            videoUrl={videoUrl}
            analysis={engineeringData}
            images={images}
            methodAnalysis={methodAnalysis}
            isImprovingMethod={isImprovingMethod}
            onImproveMethod={onImproveMethod}
          />

          {/* Keep layout visualization below if it exists - HIDE IN PRINT to avoid duplication with PDF Cover */}
          {layoutVisualization && (
            <div className="mt-8 print:hidden">
              <img src={layoutVisualization} className="w-full rounded-2xl border border-white/10" alt="Layout" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div id="analysis-report-container" className="max-w-6xl mx-auto">
        <ConfidenceBadge />
        <EngineeringDashboard data={engineeringData} />

        {/* Legacy Picture Grid Re-use if needed, or pass to Dashboard */}
        {selectedImages.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedImages.map((img, i) => (
              <img key={i} src={img.previewUrl} className="rounded-lg border border-slate-700 opacity-60 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER UTILITY ---
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={pIdx} className="text-cyber-blue print:text-indigo-600 font-black">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  // --- LEGACY MARKDOWN RENDERER (Fallback) ---
  const opNameMatch = content.match(/\*\*Nombre de la Operación\*\*:\s*(.*)/i) ||
    content.match(/\*\*Operation Name\*\*:\s*(.*)/i);
  const operationName = opNameMatch ? opNameMatch[1].trim() : "Operation Report";
  const sections = content.split(/(?=# \d\.)/).filter(s => s.trim());

  return (
    <div id="analysis-report-container" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-cyber-dark print:bg-white p-4 sm:p-12 rounded-xl border border-cyber-blue/20 print:border-slate-200 shadow-[0_0_30px_rgba(0,0,0,0.5)] print:shadow-none max-w-4xl mx-auto overflow-hidden">

      {/* HEADER */}
      <div className="border-b-[6px] border-cyber-text print:border-slate-900 pb-8 mb-10 flex justify-between items-end branding-header">
        <div className="flex items-center gap-6">
          {branding.logo && (
            <div className="w-24 h-24 rounded-lg bg-white/5 p-2 flex items-center justify-center border border-white/10 shrink-0">
              <img src={branding.logo} className="max-w-full max-h-full object-contain" alt="Company Logo" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-white print:text-slate-900 tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] print:drop-shadow-none">
              {branding.name}
            </h1>
            <p className="text-sm font-black text-cyber-blue print:text-indigo-600 uppercase tracking-[0.2em]">www.ia-agus.com</p>
            <p className="text-sm font-bold text-cyber-text/50 print:text-slate-400">{branding.labs}</p>
          </div>
        </div>
        <div className="text-right">
          {/* <div className="bg-cyber-blue print:bg-slate-900 text-black print:text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-[0_0_10px_rgba(0,240,255,0.6)] print:shadow-none">Engineering Study No. {Math.floor(Math.random() * 9000) + 1000}</div> */}
          <p className="text-lg font-mono font-black text-cyber-text print:text-slate-800">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-cyber-black print:bg-slate-50 border-y-2 border-cyber-gray print:border-slate-200 py-6 text-center">
        <h2 className="text-[10px] font-black text-cyber-blue print:text-slate-400 uppercase tracking-[0.4em] mb-2">Industrial Engineering Report</h2>
        <h3 className="text-4xl font-black text-white print:text-slate-900 uppercase tracking-tight italic drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] print:drop-shadow-none">{operationName}</h3>
      </div>

      {/* PICTURES */}
      {selectedImages.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-l-8 border-cyber-blue print:border-indigo-600 pl-4 py-1">
            <h4 className="text-xl font-black text-white print:text-slate-900 uppercase tracking-wider">Visual Process Documentation</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedImages.map((img, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border-2 border-cyber-gray print:border-slate-100 shadow-lg bg-cyber-black print:bg-white break-inside-avoid">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={img.previewUrl} className="w-full h-full object-cover transition-all" />
                </div>
                <div className="absolute top-3 left-3 bg-cyber-dark/90 print:bg-slate-900/90 text-white text-[11px] font-black px-3 py-1.5 rounded-xl uppercase border border-cyber-blue/30 print:border-none">PHASE {String(i + 1).padStart(2, '0')}</div>
                <div className="p-3 bg-cyber-dark print:bg-white border-t border-cyber-gray print:border-slate-50 flex justify-between items-center text-[9px] font-black text-cyber-text/50 print:text-slate-400">PROCESS CAPTURE <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue print:bg-indigo-500 shadow-[0_0_5px_rgba(0,240,255,0.8)] print:shadow-none"></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYSIS TEXT */}
      <div className="space-y-16">
        {sections.map((section, idx) => {
          const titleMatch = section.match(/# \d\. (.*)/);
          const title = titleMatch ? titleMatch[1] : `Section ${idx + 1}`;
          const body = section.replace(/# \d\. .*/, '').trim();
          return (
            <div key={idx} className="break-inside-avoid space-y-8 page-break-section">
              <div className="flex items-center gap-5">
                <span className="text-5xl font-black text-cyber-gray/20 print:text-slate-100 select-none text-outline-cyber print:text-outline-none">{String(idx + 1).padStart(2, '0')}</span>
                <div className="flex-grow"><h3 className="text-2xl font-black text-white print:text-slate-900 uppercase tracking-tighter">{title}</h3><div className="h-1 w-full bg-gradient-to-r from-cyber-blue to-transparent print:bg-slate-900 mt-1"></div></div>
              </div>
              <div className="pl-6 md:pl-16 whitespace-pre-wrap text-cyber-text/80 print:text-slate-700 font-medium leading-relaxed">
                {body.split('\n').map((line, lIdx) => {
                  if (line.trim() === '') return <div key={lIdx} className="h-4" />;
                  if (line.startsWith('**')) {
                    const parts = line.split(':');
                    return (
                      <div key={lIdx} className="mb-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
                        <span className="text-[10px] font-black bg-cyber-blue print:bg-slate-900 text-black print:text-white px-3 py-1 uppercase tracking-widest rounded w-fit shadow-[0_0_10px_rgba(0,240,255,0.4)] print:shadow-none">{parts[0].replace(/\*\*/g, '')}</span>
                        <span className="text-white print:text-slate-800 text-lg font-bold border-b border-cyber-gray print:border-slate-100 pb-1 flex-grow">{renderMarkdown(parts.slice(1).join(':'))}</span>
                      </div>
                    );
                  }
                  if (line.startsWith('- **')) {
                    const parts = line.split(':');
                    return (
                      <div key={lIdx} className="flex gap-5 mb-6 py-4 border-l-4 border-cyber-blue print:border-indigo-500 pl-6 bg-cyber-blue/10 print:bg-indigo-50/30 rounded-r-xl">
                        <i className="fas fa-check-double text-cyber-blue print:text-indigo-600 mt-1"></i>
                        <div>
                          <span className="text-[10px] font-black text-cyber-blue print:text-indigo-400 uppercase tracking-widest block mb-2">{parts[0].replace(/- \*\*/g, '')}</span>
                          <span className="text-white print:text-slate-900 font-black text-xl leading-tight">{renderMarkdown(parts.slice(1).join(':'))}</span>
                        </div>
                      </div>
                    );
                  }
                  return <p key={lIdx} className="text-cyber-text/70 print:text-slate-600 mb-2 text-lg">{renderMarkdown(line)}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROPOSED LAYOUT VISUALIZATION - MOVED TO END */}
      {layoutVisualization && (
        <div className="space-y-8 break-inside-avoid page-break-section">
          <div className="flex items-center gap-3 border-l-8 border-cyber-blue print:border-indigo-600 pl-4 py-1">
            <h4 className="text-xl font-black text-white print:text-slate-900 uppercase tracking-wider">Proposed Layout Architecture</h4>
          </div>
          <div className="rounded-3xl border-4 border-cyber-blue/20 print:border-slate-900/5 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] print:shadow-2xl relative">
            <img src={layoutVisualization} className="w-full h-auto" />
            <div className="absolute bottom-0 inset-x-0 bg-cyber-black/90 print:bg-slate-900/90 backdrop-blur-md p-6 text-white text-[10px] font-black border-t border-cyber-blue/30 print:border-none">
              <div className="grid grid-cols-4 gap-4 text-center uppercase tracking-widest">
                <div>LIGHTING<p className="text-cyber-blue print:text-white text-xs mt-1">1000 Lux</p></div>
                <div>SAFETY<p className="text-cyber-blue print:text-white text-xs mt-1">PPE Required</p></div>
                <div>ERGONOMICS<p className="text-cyber-blue print:text-white text-xs mt-1">Methods Optimized</p></div>
                <div>MATERIAL<p className="text-cyber-blue print:text-white text-xs mt-1">Lean Path</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER & SIGNATURE - ALIGNMENT FIXED */}
      <div className="mt-24 pt-12 border-t-[10px] border-cyber-text print:border-slate-900 flex flex-col md:flex-row justify-between items-start break-inside-avoid gap-10">
        <div className="max-w-xs space-y-4">
          <div className="flex items-center gap-3 text-cyber-blue print:text-indigo-600"><i className="fas fa-award text-2xl"></i><span className="font-black uppercase tracking-widest text-[11px]">Industrial Excellence Study</span></div>
          <p className="text-xs text-cyber-text/50 print:text-slate-400 italic">Validation by on-site engineering is required for final costing.</p>
        </div>
        <div className="flex flex-col items-end w-full md:w-auto">
          {/* Horizontal line perfectly aligned with the name's visual block */}
          <div className="w-full md:w-56 h-[4px] bg-cyber-text print:bg-slate-900 mb-2"></div>
          <div className="text-right">
            <p className="text-3xl font-black text-white print:text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Agustín Prieto</p>
            <p className="text-[11px] font-black text-cyber-text/50 print:text-slate-400 uppercase tracking-[0.4em]">Director of Engineering | IA.AGUS Labs</p>
            <p className="text-sm font-black text-cyber-blue print:text-indigo-600 mt-2">www.ia-agus.com</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 10mm; size: letter portrait; }
          body { 
            background-color: white !important; 
            color: #0f172a !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          /* Hide all non-report elements globally */
          header, footer, button, .no-print, nav, aside { display: none !important; }
          
          /* CRITICAL: Hide Chat Interface in Print */
          #analysis-report-container ~ div, 
          .h-\\[500px\\],
          [class*="ReportChat"] { display: none !important; }
          
          /* Hide operation thumbnails, keep only layout image */
          .grid-cols-6 { display: none !important; }
          
          /* Reset container specifics */
          #analysis-report-container { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            background-color: white !important; 
            max-width: none !important;
            width: 100% !important;
            display: block !important;
            opacity: 1 !important;
          }

          /* Force branding header visibility */
          .branding-header { display: flex !important; border-bottom-color: #0f172a !important; }
          
          /* Override Cyber Colors with Corporate Slate */
          .bg-cyber-dark, .bg-cyber-black { background-color: white !important; }
          .bg-cyber-blue { background-color: #0f172a !important; color: white !important; } /* Use Slate-900 for accents */
          .border-cyber-blue\/20, .border-cyber-gray { border-color: #cbd5e1 !important; }
          
          /* Text Colors */
          .text-white { color: #0f172a !important; }
          .text-cyber-blue { color: #4338ca !important; } /* Indigo-700 */
          .text-cyber-text { color: #475569 !important; } /* Slate-600 */
          .text-cyber-text\/50 { color: #94a3b8 !important; } /* Slate-400 */
          
          /* Remove Cyber Effects */
          .shadow-\[0_0_30px_rgba\(0\,0\,0\,0\.5\)\], .shadow-\[0_0_15px_rgba\(0\,240\,255\,0\.3\)\] { box-shadow: none !important; }
          .drop-shadow-\[0_0_10px_rgba\(0\,240\,255\,0\.5\)\] { filter: none !important; }
          .animate-pulse { animation: none !important; }
          
          /* Ensure Grid Layouts Hold */
          .grid, .flex { display: flex !important; } 
          
          /* Page Breaks */
          .page-break-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 2rem; display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default AnalysisDisplay;
