import React, { useState, useRef } from 'react';
import Header from './components/Header';
import AnalysisDisplay from './components/AnalysisDisplay';
import HistorySidebar from './components/HistorySidebar';
import ReportChat from './components/ReportChat';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import LineBalancingView from './components/views/LineBalancingView';
import CostingView from './components/views/CostingView';
import SettingsView from './components/views/SettingsView';
import RegionalComparisonView from './components/views/RegionalComparisonView';
import KnowledgeHubView from './components/views/KnowledgeHubView';
import PhotoGalleryView from './components/views/PhotoGalleryView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/AuthContext';
import { FileData, UploadState, HistoryItem } from './types';
import { useAnalysisHistory } from './hooks/useAnalysisHistory';
import { analyzeSewingOperation, generateLayoutImage, createLayoutPrompt } from './services/geminiService';
import { exportToPDF } from './services/pdfService';

interface AppError {
  title: string;
  message: string;
  solutions: string[];
}

const App: React.FC = () => {
  // Auth State
  const { user, isAuthenticated, logout } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis' | 'balancing' | 'costing' | 'regional' | 'library' | 'gallery' | 'settings'>('analysis');

  // Core State
  const [files, setFiles] = useState<FileData[]>([]);
  const [state, setState] = useState<UploadState>('idle');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutPrompt, setLayoutPrompt] = useState<string | null>(null);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isImageApproved, setIsImageApproved] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [language, setLanguage] = useState<'es' | 'en'>('en');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { history, saveToHistory, clearHistory, deleteItem } = useAnalysisHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFrames = async (videoFile: File): Promise<FileData[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.play();
      const frames: FileData[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      video.onerror = () => reject(new Error("Error loading video."));
      video.onloadedmetadata = async () => {
        const duration = video.duration;
        const frameCount = 6;
        const intervals = Array.from({ length: frameCount }, (_, i) => (i + 0.5) / frameCount);
        try {
          for (let i = 0; i < intervals.length; i++) {
            video.currentTime = duration * intervals[i];
            await new Promise(r => video.onseeked = r);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            frames.push({
              name: `Phase_${i + 1}_${videoFile.name}`,
              mimeType: 'image/jpeg',
              base64,
              previewUrl: base64,
              selected: true
            });
          }
          video.pause();
          URL.revokeObjectURL(video.src);
          resolve(frames);
        } catch (err) { reject(err); }
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setError(null);
    setState('processing');
    const newFiles: FileData[] = [];
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.type.startsWith('video')) {
          setProcessingStatus(language === 'es' ? `Procesando: ${file.name}...` : `Processing: ${file.name}...`);
          const videoFrames = await extractFrames(file);
          newFiles.push(...videoFrames);
        } else if (file.type.startsWith('image')) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newFiles.push({ name: file.name, mimeType: file.type, base64, previewUrl: URL.createObjectURL(file), selected: true });
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      setState('idle');
    } catch (err: any) {
      setError({ title: "Upload Error", message: "Failed to load files.", solutions: ["Check file format."] });
      setState('error');
    } finally { setProcessingStatus(""); }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFileSelection = (index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f));
  };

  const runAnalysis = async () => {
    if (files.length === 0) return;
    setState('processing');
    setProcessingStatus("IA.AGUS: Running algorithms...");
    setError(null);
    setAnalysis(null);
    setLayoutImage(null);
    setLayoutPrompt(null);
    setIsImageApproved(false);
    try {
      const result = await analyzeSewingOperation(files, language);
      setAnalysis(result);
      setState('success');
      saveToHistory(result, files);
    } catch (err: any) {
      setError({ title: "Analysis Failed", message: "IA.AGUS could not complete study.", solutions: ["Check connectivity."] });
      setState('error');
    } finally { setProcessingStatus(""); }
  };

  const handleGeneratePrompt = async () => {
    if (!analysis) return;
    setIsGeneratingPrompt(true);
    try {
      const prompt = await createLayoutPrompt(analysis, language);
      setLayoutPrompt(prompt);
    } catch (err) { console.error(err); }
    finally { setIsGeneratingPrompt(false); }
  };

  const handleGenerateLayout = async () => {
    if (!layoutPrompt) return;
    setIsGeneratingLayout(true);
    try {
      const img = await generateLayoutImage(layoutPrompt);
      setLayoutImage(img);
    } catch (err) { console.error(err); }
    finally { setIsGeneratingLayout(false); }
  };

  const copyPromptToClipboard = () => {
    if (layoutPrompt) {
      navigator.clipboard.writeText(layoutPrompt);
      alert(language === 'es' ? "Prompt copiado al portapapeles" : "Prompt copied to clipboard");
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF('analysis-report-container', `Report-IA-AGUS.pdf`);
    } catch (err) {
      setError({ title: "PDF Error", message: "Export failed.", solutions: ["Memory full?"] });
    } finally { setIsExporting(false); }
  };

  const reset = () => {
    setFiles([]); setAnalysis(null); setLayoutImage(null); setLayoutPrompt(null);
    setIsImageApproved(false); setError(null); setState('idle');
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setAnalysis(item.analysis);
    setFiles(item.images || []);
    setState('success');
    setCurrentView('analysis');
    setIsHistoryOpen(false);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Main app render
  return (
    <div className="flex h-screen bg-cyber-black text-cyber-text overflow-hidden font-inter selection:bg-cyber-blue/30 selection:text-cyber-blue">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-purple/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(10,10,11,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(10,10,11,0.8)_2px,transparent_2px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-20"></div>
      </div>

      {/* NEW: Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        language={language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 ml-20 md:ml-64 h-full overflow-hidden transition-all duration-300">

        {/* Header - Shared across views */}
        <Header
          language={language}
          setLanguage={setLanguage}
          onToggleHistory={() => setIsHistoryOpen(true)}
          user={user}
          onLogout={logout}
        />

        {/* View Router */}
        <main className="flex-1 overflow-hidden relative flex flex-col">

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && <DashboardView />}

          {/* VIEW: LINE BALANCING */}
          {currentView === 'balancing' && <LineBalancingView />}

          {/* VIEW: COSTING */}
          {currentView === 'costing' && <CostingView />}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && <SettingsView />}

          {/* VIEW: REGIONAL COMPARISON */}
          {currentView === 'regional' && <RegionalComparisonView />}

          {/* VIEW: KNOWLEDGE HUB */}
          {currentView === 'library' && <KnowledgeHubView />}

          {/* VIEW: PHOTO GALLERY */}
          {currentView === 'gallery' && <PhotoGalleryView />}

          {/* VIEW: ANALYSIS (Original App Logic) */}
          <div className={`flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar ${currentView === 'analysis' ? 'block' : 'hidden'}`}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT COLUMN: UPLOAD & CHAT */}
              <div className="lg:col-span-4 space-y-6">
                {/* PLANT STUDY CARD */}
                <div className="bg-cyber-dark border border-cyber-blue/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                    <i className="fas fa-industry text-cyber-blue"></i>
                    {language === 'es' ? 'Estudio de Planta' : 'Plant Study'}
                  </h2>

                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${state === 'dragover' ? 'border-cyber-blue bg-cyber-blue/10 scale-[1.02]' : 'border-cyber-gray hover:border-cyber-blue/50 hover:bg-cyber-dark/80'}`}
                    onDragOver={(e) => { e.preventDefault(); setState('dragover'); }}
                    onDragLeave={() => setState('idle')}
                    onDrop={(e) => {
                      e.preventDefault();
                      setState('processing');
                      const dt = e.dataTransfer;
                      if (fileInputRef.current) {
                        fileInputRef.current.files = dt.files;
                        const event = new Event('change', { bubbles: true });
                        fileInputRef.current.dispatchEvent(event);
                      }
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept="video/*,image/*"
                    />
                    <div className="w-16 h-16 mx-auto bg-cyber-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <i className="fas fa-cloud-upload-alt text-2xl text-cyber-blue"></i>
                    </div>
                    <p className="text-sm font-bold text-white mb-2">{language === 'es' ? 'Arrastra videos de operación mp4' : 'Drag operation videos mp4'}</p>
                    <p className="text-xs text-cyber-text/50 mb-4">{language === 'es' ? 'Soporta MP4, MOV, AVI' : 'Supports MP4, MOV, AVI'}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-cyber-blue text-black font-black rounded-lg uppercase tracking-wider text-xs hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    >
                      {language === 'es' ? 'Explorar Archivos' : 'Browse Files'}
                    </button>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {files.map((file, idx) => (
                          <div key={idx} onClick={() => toggleFileSelection(idx)} className={`group relative rounded-lg overflow-hidden border h-16 shadow-sm cursor-pointer transition-all ${file.selected !== false ? 'border-cyber-blue shadow-[0_0_5px_rgba(0,240,255,0.3)]' : 'border-cyber-gray opacity-40'}`}>
                            <img src={file.previewUrl} className="w-full h-full object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute bottom-1 right-1 bg-black/80 text-red-500 w-5 h-5 rounded-full border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-trash-alt text-[10px]"></i></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={runAnalysis} disabled={state === 'processing'} className="w-full py-3 rounded-lg font-black text-black bg-cyber-blue hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all uppercase tracking-widest text-xs">
                        {state === 'processing' ? 'PROCESANDO...' : 'RUN IA.AGUS CORE'}
                      </button>
                      <button onClick={() => {
                        setAnalysis(`**Nombre de la Operación**: Costura Recta - Demo Estándar\n**Fecha**: ${new Date().toLocaleDateString()}\n\n# 1. Resumen Ejecutivo\nEl análisis preliminar indica una eficiencia operativa del **87%**. Se han identificado oportunidades clave en la manipulación de materiales.\n\n# 2. Desglose GSD (General Sewing Data)\n**Código 4.1**: Posicionamiento Inicial\n- **Tiempo Estándar**: 3.5s\n- **Tiempo Real**: 4.2s\n- **Observación**: El operador realiza un ajuste manual innecesario antes de la puntada inicial.\n\n**Código 5.3**: Ciclo de Costura\n- **Velocidad**: 2500 RPM\n- **Calidad**: Aprobada (Sin fruncido visible)\n\n# 3. Recomendaciones de Ingeniería\n- **Inmediata**: Implementar guías magnéticas de tope para eliminar el micro-ajuste inicial.\n- **Ergonómica**: Ajustar iluminación focal a 1000 lux en el punto de aguja.\n`);
                        setState('success');
                        setProcessingStatus('COMPLETE');
                      }} className="w-full py-3 rounded-lg font-bold text-cyber-blue border border-cyber-blue/30 hover:bg-cyber-blue/10 hover:border-cyber-blue transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                        <i className="fas fa-eye"></i>
                        {language === 'es' ? 'Ver Formato de Reporte (Mock)' : 'Preview Report Format'}
                      </button>
                    </div>
                  )}
                </div>

                {/* CHAT INTERFACE */}
                {analysis && (
                  <div className="h-[500px]">
                    <ReportChat analysisContext={analysis} language={language} />
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: DISPLAY & RESULTS */}
              <div className="lg:col-span-8">
                {analysis && state === 'success' && (
                  <div className="space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]"><i className="fas fa-check text-xs animate-pulse"></i></div>
                        <span className="text-sm font-bold text-cyber-text">Validated by IA.AGUS</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <button
                          onClick={handleExportPDF}
                          disabled={isExporting}
                          className="flex-1 py-3 bg-cyber-black border border-cyber-blue/30 text-cyber-blue rounded-xl font-bold hover:bg-cyber-blue hover:text-black transition-all flex items-center justify-center gap-2 group print:hidden px-4"
                        >
                          {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf group-hover:scale-110 transition-transform"></i>}
                          {language === 'es' ? 'Guardar PDF' : 'Save PDF'}
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="flex-1 py-3 bg-cyber-black border border-cyber-purple/30 text-cyber-purple rounded-xl font-bold hover:bg-cyber-purple hover:text-white transition-all flex items-center justify-center gap-2 group print:hidden px-4"
                        >
                          <i className="fas fa-print group-hover:scale-110 transition-transform"></i>
                          {language === 'es' ? 'Vista Impresión' : 'Print Preview'}
                        </button>
                        <button onClick={reset} className="w-12 h-12 flex items-center justify-center bg-cyber-dark text-cyber-purple border border-cyber-purple/30 rounded-xl hover:bg-cyber-purple hover:text-white shadow-lg transition-all print:hidden"><i className="fas fa-plus"></i></button>
                      </div>
                    </div>
                    <AnalysisDisplay content={analysis} images={files} layoutVisualization={isImageApproved ? layoutImage : null} />
                  </div>
                )}
                {!analysis && state !== 'processing' && <div className="h-full flex flex-col items-center justify-center text-center p-16 bg-cyber-dark/30 rounded-2xl border-2 border-dashed border-cyber-gray/50 shadow-inner backdrop-blur-sm">
                  <i className="fas fa-microscope text-5xl text-cyber-gray mb-8"></i>
                  <h3 className="text-2xl font-black text-cyber-text/50 mb-4 tracking-wider">IA.AGUS VIDEO LAB</h3>
                  <p className="text-sm text-cyber-text/30 font-mono">Select a video to begin analysis.</p>
                </div>}

                {/* PROCESSING STATE */}
                {state === 'processing' && (
                  <div className="h-full flex items-center justify-center p-16 bg-cyber-dark/50 rounded-2xl border border-cyber-blue/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                    <div className="text-center space-y-10">
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 border-4 border-cyber-blue/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-cyber-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-brain text-4xl text-cyber-blue animate-pulse"></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 animate-pulse">{language === 'es' ? 'Analizando...' : 'Analyzing...'}</h3>
                        <p className="text-cyber-blue font-mono text-sm">{processingStatus}</p>
                      </div>
                      <div className="max-w-md mx-auto bg-black/50 rounded-lg p-4 border border-cyber-blue/10">
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                          Gemini 2.0 Flash Engine Active
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* RIGHT SIDEBAR: HISTORY */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleLoadHistory}
        onDelete={deleteItem}
        onClear={clearHistory}
        language={language}
      />
    </div>
  );
};

export default App;
