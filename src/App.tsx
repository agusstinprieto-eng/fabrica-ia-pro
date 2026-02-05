import React, { useState, useRef, useEffect } from 'react';
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
import GlobalIntelligenceView from './components/views/GlobalIntelligenceView';
import KnowledgeHubView from './components/views/KnowledgeHubView';
import PhotoGalleryView from './components/views/PhotoGalleryView';
import PredictiveMaintenanceView from './components/views/PredictiveMaintenanceView';
import SupportView from './components/views/SupportView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/AuthContext';
import { FileData, UploadState, HistoryItem } from './types';
import { useAnalysisHistory } from './hooks/useAnalysisHistory';
import { analyzeOperation, createLayoutPrompt, createVideoPrompt, IndustrialMode, improveMethod } from './services/geminiService';
import { exportToPDF } from './services/pdfService';
import { SimulationProvider, useSimulation } from './contexts/SimulationContext';
// import { useVoiceCommands } from './hooks/useVoiceCommands';
import InteractiveTour from './components/InteractiveTour';
import AdminView from './components/AdminView';
import { VisualQuoter } from './components/VisualQuoter';
import { ComplianceReportDisplay } from './components/SafetyCompliance/ComplianceReportDisplay';
import { analyzeSafetyCompliance, extractFramesFromVideo } from './services/safetyAnalysisService';
import { ComplianceReport } from './types/safety';

interface AppError {
  title: string;
  message: string;
  solutions: string[];
}

const AppContent: React.FC = () => {
  // Auth State
  const { user, isAuthenticated, logout, incrementAnalysis, remainingAnalyses, isDemoExpired } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis' | 'balancing' | 'costing' | 'regional' | 'global-intelligence' | 'library' | 'gallery' | 'quoter' | 'support' | 'settings'>('analysis');

  // Core State
  const [files, setFiles] = useState<FileData[]>([]);
  const [state, setState] = useState<UploadState>('idle');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutPrompt, setLayoutPrompt] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<'image' | 'video' | null>(null);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isImageApproved, setIsImageApproved] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<'es' | 'en'>('en');
  const [industrialMode, setIndustrialMode] = useState<IndustrialMode>('automotive');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFactoryMode, setIsFactoryMode] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [godModeBypass, setGodModeBypass] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Safety Compliance State
  const [enableSafetyCheck, setEnableSafetyCheck] = useState(false);
  const [safetyReport, setSafetyReport] = useState<ComplianceReport | null>(null);
  const [isSafetyAnalyzing, setIsSafetyAnalyzing] = useState(false);

  // Method Improvement State
  const [methodAnalysis, setMethodAnalysis] = useState<any>(null);
  const [isImprovingMethod, setIsImprovingMethod] = useState(false);

  // Get updateMetricsFromAnalysis from simulation context
  // This is safe now because AppContent is wrapped by SimulationProvider in App component
  const { updateMetricsFromAnalysis } = useSimulation();

  useEffect(() => {
    const tourCompleted = localStorage.getItem('tour-completed');
    if (!tourCompleted) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('factory-mode');
    if (savedMode === 'true') {
      document.body.classList.add('factory-floor');
      setIsFactoryMode(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'processing') {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 50); // Fast updates for high impact
    }
    return () => clearInterval(interval);
  }, [state]);

  const { history, saveToHistory, clearHistory, deleteItem } = useAnalysisHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFrames = async (videoFile: File): Promise<FileData[]> => {
    return new Promise((resolve, reject) => {
      console.log("Starting frame extraction for:", videoFile.name);
      const video = document.createElement('video');
      video.preload = 'auto'; // Changed from 'metadata' to 'auto' for better loading
      video.playsInline = true;
      video.muted = true;

      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;

      const frames: FileData[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Timeout for loading metadata
      const loadTimeout = setTimeout(() => {
        console.error("Metadata load timeout");
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Timeout loading video metadata. Codec might be unsupported."));
      }, 15000); // Increased to 15s

      video.onerror = (e) => {
        console.error("Video element error:", video.error, e);
        clearTimeout(loadTimeout);
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Error loading video: ${video.error?.message || 'Unknown codec error'}`));
      };

      video.onloadedmetadata = async () => {
        clearTimeout(loadTimeout);
        console.log("Metadata loaded. Duration:", video.duration);

        let duration = video.duration;
        if (!isFinite(duration) || duration === 0) {
          // Fallback for some container formats that don't report duration initially
          duration = 10;
          console.warn("Duration infinite or zero, defaulting to 10s scan");
        }

        // Check video duration limit (2 minutes = 120 seconds)
        if (duration > 120) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Video too long. Maximum duration: 2 minutes."));
          return;
        }

        const frameCount = 12; // Sweet spot for precision/performance
        const interval = duration / (frameCount + 1);

        try {
          for (let i = 1; i <= frameCount; i++) {
            const seekTime = interval * i;
            setProcessingStatus(language === 'es' ? `Capturando momento ${i}/${frameCount}...` : `Capturing moment ${i}/${frameCount}...`);

            // Robust seek with timeout
            await new Promise<void>((seekResolve) => {
              const timeout = setTimeout(() => {
                console.warn(`Seek timeout at ${seekTime}s`);
                seekResolve();
              }, 4000);

              const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                clearTimeout(timeout);
                // Extra small delay to ensure frame is painted
                setTimeout(seekResolve, 50);
              };

              video.addEventListener('seeked', onSeeked);
              video.currentTime = seekTime;
            });

            if (ctx) {
              const MAX_WIDTH = 720;
              let width = video.videoWidth;
              let height = video.videoHeight;

              if (width > MAX_WIDTH) {
                const ratio = MAX_WIDTH / width;
                width = MAX_WIDTH;
                height = height * ratio;
              }

              canvas.width = width;
              canvas.height = height;

              ctx.drawImage(video, 0, 0, width, height);
              const base64 = canvas.toDataURL('image/jpeg', 0.7);

              if (base64 && base64.length > 200) {
                frames.push({
                  name: `T${seekTime.toFixed(2)}s.jpg`,
                  mimeType: 'image/jpeg',
                  base64,
                  previewUrl: base64,
                  selected: true
                });
              }
            }
          }

          URL.revokeObjectURL(objectUrl);
          if (frames.length === 0) {
            reject(new Error("No frames could be extracted."));
          } else {
            resolve(frames);
          }
        } catch (err) {
          console.error("Frame extraction loop error:", err);
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      // Force load (sometimes needed for mobile/safari, helpful for desktop too)
      video.load();
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
          setOriginalVideoUrl(URL.createObjectURL(file)); // Store original video URL
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
      console.error("File processing error:", err);
      setError({
        title: "Upload Error / Error de Carga",
        message: err.message || "Failed to process video. Memory limit or codec issue.",
        solutions: ["Try a shorter video (max 30s) / Prueba video mÃ¡s corto", "Use standard MP4 / Usa MP4 estÃ¡ndar", "Check internet connection"]
      });
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

    // CHECK DEMO LIMITS (Enabled with Admin Bypass)
    if (user?.role !== 'admin') {
      if (!incrementAnalysis()) {
        const title = isDemoExpired ? "Demo Expired" : "Limit Reached";
        const message = isDemoExpired
          ? "Your 24-hour demo period has ended. Please upgrade to continue."
          : "You have reached the limit of 3 free analyses in this demo.";

        setError({
          title: language === 'es' ? (isDemoExpired ? "Demo Expirada" : "LÃ­mite Alcanzado") : title,
          message: language === 'es' ? (isDemoExpired ? "Tu demo de 24h ha terminado." : "Has alcanzado el lÃ­mite de 3 anÃ¡lisis.") : message,
          solutions: [language === 'es' ? "Contactar Ventas" : "Contact Sales"]
        });
        setState('error');
        return;
      }
    }

    setState('processing');
    setElapsedTime(0);
    setProcessingStatus(language === 'es' ? "IA.AGUS: Ejecutando algoritmos..." : "IA.AGUS: Running algorithms...");
    setError(null);
    setAnalysis(null);
    setLayoutImage(null);
    setLayoutPrompt(null);
    setIsImageApproved(false);
    setSafetyReport(null); // Reset safety report
    setMethodAnalysis(null); // Reset method analysis

    try {
      const result = await analyzeOperation(files, industrialMode, language);
      setAnalysis(result);
      setState('success');

      // NEW: Apply Real Metrics to Dashboard
      try {
        let analysisObj: any = null;
        if (typeof result === 'object' && result !== null) {
          analysisObj = result;
        } else if (typeof result === 'string') {
          const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
          const firstBrace = cleanJson.indexOf('{');
          const lastBrace = cleanJson.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            analysisObj = JSON.parse(cleanJson.substring(firstBrace, lastBrace + 1));
          }
        }

        if (analysisObj) {
          updateMetricsFromAnalysis(analysisObj);
        }
      } catch (e) {
        console.warn("Failed to parse analysis for metrics update", e);
      }

      saveToHistory(result, files);

      // Run safety compliance check if enabled
      if (enableSafetyCheck && files.length > 0 && files[0].type.startsWith('video/')) {
        setIsSafetyAnalyzing(true);
        setProcessingStatus(language === 'es' ? "Analizando cumplimiento de seguridad..." : "Analyzing safety compliance...");

        try {
          // Extract frames from first video file
          const videoFile = files[0].file;
          if (videoFile) {
            const frames = await extractFramesFromVideo(videoFile, 2); // 1 frame every 2 seconds
            const safetyResult = await analyzeSafetyCompliance(frames, 'safety_glasses');
            setSafetyReport(safetyResult);
          }
        } catch (safetyError) {
          console.error('Safety analysis failed:', safetyError);
          // Don't fail the entire analysis, just log the error
        } finally {
          setIsSafetyAnalyzing(false);
          setProcessingStatus("");
        }
      }
    } catch (err: any) {
      setError({ title: "Analysis Failed", message: "IA.AGUS could not complete study.", solutions: ["Check connectivity."] });
      setState('error');
    } finally {
      if (!enableSafetyCheck) {
        setProcessingStatus("");
      }
    }
  };

  const [promptStyle, setPromptStyle] = useState<any>('actual_feasible'); // Default to Actual Feasible

  const handleGeneratePrompt = async () => {
    if (!analysis) return;
    setLayoutPrompt(null); // Clear previous prompt
    setIsGeneratingPrompt(true);
    setPromptType('image'); // Indicate Image Mode
    try {
      const prompt = await createLayoutPrompt(analysis, language, promptStyle);
      setLayoutPrompt(prompt);
    } catch (err) { console.error(err); }
    finally { setIsGeneratingPrompt(false); }
  };

  const handleGenerateVideoPrompt = async () => {
    if (!analysis) return;
    setLayoutPrompt(null); // Clear previous prompt
    setIsGeneratingPrompt(true);
    setPromptType('video'); // Indicate Video Mode
    try {
      const prompt = await createVideoPrompt(analysis, language, promptStyle);
      setLayoutPrompt(prompt);
    } catch (err) { console.error(err); }
    finally { setIsGeneratingPrompt(false); }
  };

  const handleImproveMethod = async () => {
    if (files.length === 0) return;
    setIsImprovingMethod(true);
    try {
      const result = await improveMethod(files, industrialMode, language, promptStyle);
      let parsed = result;
      if (typeof result === 'string') {
        const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
        }
      }
      setMethodAnalysis(parsed);
    } catch (err: any) {
      setError({ title: "Method Optimization Failed", message: err.message, solutions: ["Try again", "Check video format"] });
    } finally {
      setIsImprovingMethod(false);
    }
  };

  // ... (Upload handlers remain the same) ...



  const handleUploadBlueprint = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLayoutImage(reader.result as string);
        setIsImageApproved(true); // Auto-approve uploaded images
      };
      reader.readAsDataURL(file);
    }
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
      // Pass the layoutImage as the cover ONLY if the user has approved it
      const coverImageToUse = (layoutImage && isImageApproved) ? layoutImage : null;
      await exportToPDF('analysis-report-container', `Report-${industrialMode.toUpperCase()}-IA-AGUS.pdf`, coverImageToUse);
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


  // Voice commands disabled
  // const { isListening, lastCommand } = useVoiceCommands(setCurrentView, language);
  const isListening = false;
  const lastCommand = "";

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // God Mode Admin Check
  if (user?.role === 'admin' && !godModeBypass) {
    return (
      <AdminView
        onBack={logout}
        onGoToApp={() => setGodModeBypass(true)}
      />
    );
  }

  // Main app render
  return (
    <div className="flex h-screen bg-cyber-black text-cyber-text overflow-hidden font-inter selection:bg-cyber-blue/30 selection:text-cyber-blue relative">
      {/* NEW: Left Navigation Sidebar */}
      {/* NEW: Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        language={language}
        user={user}
        onLogout={logout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 ml-0 md:ml-64 h-full overflow-hidden transition-all duration-300 print:ml-0">

        {/* Header - Shared across views */}
        <Header
          language={language}
          setLanguage={setLanguage}
          onToggleHistory={() => setIsHistoryOpen(true)}
          user={user}
          onLogout={logout}
          isListening={isListening}
          lastCommand={lastCommand}
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* View Router */}
        {/* SimulationProvider was here in parent, now provided by wrapper */}
        <main className="flex-1 overflow-hidden relative flex flex-col">

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigateToAnalysis={() => setCurrentView('analysis')}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onExportSummary={() => { }}
              mode={industrialMode}
            />
          )}

          {/* VIEW: LINE BALANCING */}
          {currentView === 'balancing' && <LineBalancingView mode={industrialMode} setMode={setIndustrialMode} />}

          {/* VIEW: COSTING */}
          {currentView === 'costing' && <CostingView mode={industrialMode} setMode={setIndustrialMode} />}

          {/* VIEW: PREDICTIVE MAINTENANCE */}
          {currentView === 'maintenance' && <PredictiveMaintenanceView />}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <SettingsView
              language={language}
              onRestartTour={() => {
                setCurrentView('analysis');
                setShowTour(true);
                localStorage.removeItem('tour-completed');
              }}
            />
          )}

          {/* VIEW: REGIONAL COMPARISON */}
          {currentView === 'regional' && <RegionalComparisonView mode={industrialMode} setMode={setIndustrialMode} />}
          {currentView === 'global-intelligence' && <GlobalIntelligenceView />}

          {/* VIEW: KNOWLEDGE HUB */}
          {currentView === 'library' && <KnowledgeHubView />}

          {/* VIEW: PHOTO GALLERY */}
          {currentView === 'gallery' && <PhotoGalleryView />}

          {/* VIEW: SUPPORT */}
          {currentView === 'support' && <SupportView language={language} />}

          {/* VIEW: VISUAL QUOTER */}
          {currentView === 'quoter' && <VisualQuoter />}

          {/* VIEW: ANALYSIS (Original App Logic) */}
          <div className={`flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar ${currentView === 'analysis' ? 'block' : 'hidden'}`}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT COLUMN: UPLOAD & CHAT */}
              <div className="lg:col-span-4 space-y-6 print:hidden">
                {/* PLANT STUDY CARD */}
                <div className="bg-cyber-dark border border-cyber-blue/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  {/* MODE SELECTOR HEADER */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        <i className="fas fa-industry text-cyber-blue"></i>
                        {language === 'es' ? 'AnÃ¡lisis Industrial' : 'Industrial Analysis'}
                      </h2>
                      {/* DEMO BADGE */}
                      <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${remainingAnalyses === 0 ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'}`}>
                        <i className="fas fa-hourglass-half"></i>
                        {remainingAnalyses} {language === 'es' ? 'Restantes' : 'Left'}
                      </div>
                    </div>

                    <div className="relative z-20">
                      <label className="text-[10px] text-cyber-text/50 uppercase tracking-widest mb-1 block">
                        {language === 'es' ? 'Modo de Industria' : 'Industry Mode'}
                      </label>
                      <select
                        id="industry-selector"
                        value={industrialMode}
                        onChange={(e) => setIndustrialMode(e.target.value as IndustrialMode)}
                        className="w-full bg-cyber-black border border-cyber-blue text-cyber-blue text-xs font-bold uppercase rounded-lg p-2 focus:ring-2 focus:ring-cyber-blue outline-none shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all hover:bg-cyber-dark"
                      >
                        <option value="automotive" className="bg-cyber-black text-white">🚗 {language === 'es' ? 'Automotriz (Optimización de Procesos)' : 'Automotive (Process Optimization)'}</option>
                        <option value="aerospace" className="bg-cyber-black text-white">✈️ {language === 'es' ? 'Aeroespacial (Calidad y Control)' : 'Aerospace (Quality & Control)'}</option>
                        <option value="electronics" className="bg-cyber-black text-white">⚡ {language === 'es' ? 'Electrónica (Estándares de Ensamblaje)' : 'Electronics (Assembly Standards)'}</option>
                        <option value="textile" className="bg-cyber-black text-white">🧵 {language === 'es' ? 'Textil (Métodos y Tiempos)' : 'Textile (Methods & Time Standards)'}</option>
                        <option value="footwear" className="bg-cyber-black text-white">👟 {language === 'es' ? 'Calzado (Costura y Montado)' : 'Footwear (Stitching & Lasting)'}</option>
                        <option value="pharmaceutical" className="bg-cyber-black text-white">💊 {language === 'es' ? 'Farmacéutica (Cumplimiento y Calidad)' : 'Pharma (Quality & Compliance)'}</option>
                        <option value="food" className="bg-cyber-black text-white">🥗 {language === 'es' ? 'Alimentos (Inocuidad y Calidad)' : 'Food (Safety & Quality)'}</option>
                        <option value="metalworking" className="bg-cyber-black text-white">⚙️ {language === 'es' ? 'Metalmecánica (CNC y Soldadura)' : 'Metalworking (CNC & Welding)'}</option>
                        <option value="medical_devices" className="bg-cyber-black text-white">🩺 {language === 'es' ? 'Dispositivos Médicos (Manufactura de Precisión)' : 'Medical Devices (Precision Manufacturing)'}</option>
                        <option value="energy" className="bg-cyber-black text-white">🔋 {language === 'es' ? 'Energía y Renovables (Sistemas y Baterías)' : 'Energy & Renewables (Systems & Batteries)'}</option>
                        <option value="plastics" className="bg-cyber-black text-white">🧪 {language === 'es' ? 'Plásticos y Moldes (Inyección y Mantenimiento)' : 'Plastics & Molds (Injection & Maintenance)'}</option>
                      </select>
                    </div>
                  </div>

                  <div
                    id="upload-area"
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
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 mb-4">
                      <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i>
                        {language === 'es' ? 'Nota: Máximo 2 minutos por video' : 'Note: Maximum 2 minutes per video'}
                      </p>
                    </div>

                    {/* SAFETY COMPLIANCE TOGGLE REMOVED - Connectivity Error Fix */}

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-cyber-blue text-black font-black rounded-lg uppercase tracking-wider text-xs hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] mt-4"
                    >
                      {language === 'es' ? 'Explorar Archivos' : 'Browse Files'}
                    </button>
                  </div>

                  {/* STATUS & FEEDBACK - Always visible if active */}
                  {state === 'processing' && (
                    <div className="mt-6 p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-microchip text-cyber-blue fa-spin"></i>
                        <span className="text-cyber-blue font-bold text-sm tracking-wide">
                          {processingStatus || (language === 'es' ? 'Procesando Video...' : 'Processing Video...')}
                        </span>
                      </div>
                    </div>
                  )}

                  {state === 'error' && error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <i className="fas fa-exclamation-triangle text-red-500"></i>
                        <span className="text-red-500 font-bold text-sm">{error.title}</span>
                      </div>
                      <p className="text-xs text-red-400 opacity-80">{error.message}</p>
                      {error.solutions && (
                        <ul className="list-disc pl-4 mt-2 text-[10px] text-red-300">
                          {error.solutions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* FILE LIST & ACTIONS */}
                  {(files.length > 0) && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {files.map((file, idx) => (
                          <div key={idx} onClick={() => toggleFileSelection(idx)} className={`group relative rounded-lg overflow-hidden border h-16 shadow-sm cursor-pointer transition-all ${file.selected !== false ? 'border-cyber-blue shadow-[0_0_5px_rgba(0,240,255,0.3)]' : 'border-cyber-gray opacity-40'}`}>
                            <img src={file.previewUrl} className="w-full h-full object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute bottom-1 right-1 bg-black/80 text-red-500 w-5 h-5 rounded-full border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-trash-alt text-[10px]"></i></button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <button id="analyze-button" onClick={runAnalysis} disabled={state === 'processing'} className="w-full py-4 rounded-xl font-black text-black bg-gradient-to-r from-cyber-blue to-cyan-400 hover:from-white hover:to-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 group">
                          {state === 'processing' ? (
                            <>
                              <i className="fas fa-spinner fa-spin text-black"></i>
                              {language === 'es' ? 'PROCESANDO...' : 'PROCESSING...'}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-bolt text-lg group-hover:animate-pulse"></i>
                              {language === 'es' ? 'ANALIZAR AHORA' : 'RUN IA.AGUS CORE'}
                            </>
                          )}
                        </button>

                        <button onClick={() => {
                          setAnalysis(`**Nombre de la OperaciÃ³n**: Costura Recta - Demo EstÃ¡ndar\n**Fecha**: ${new Date().toLocaleDateString()}\n\n# 1. Resumen Ejecutivo\nEl anÃ¡lisis preliminar indica una eficiencia operativa del **87%**. Se han identificado oportunidades clave en la manipulaciÃ³n de materiales.\n\n# 2. Desglose Operativo (MÃ©todos EstÃ¡ndar)\n**CÃ³digo 4.1**: Posicionamiento Inicial\n- **Tiempo EstÃ¡ndar**: 3.5s\n- **Tiempo Real**: 4.2s\n- **ObservaciÃ³n**: El operador realiza un ajuste manual innecesario antes de la puntada inicial.\n\n**CÃ³digo 5.3**: Ciclo de Costura\n- **Velocidad**: 2500 RPM\n- **Calidad**: Aprobada (Sin fruncido visible)\n\n# 3. Recomendaciones de IngenierÃ­a\n- **Inmediata**: Implementar guÃ­as magnÃ©ticas de tope para eliminar el micro-ajuste inicial.\n- **ErgonÃ³mica**: Ajustar iluminaciÃ³n focal a 1000 lux en el punto de aguja.\n`);
                          setState('success');
                          setProcessingStatus('COMPLETE');
                        }} className="w-full py-3 rounded-xl font-bold text-cyber-text/70 border border-white/10 hover:bg-white/5 hover:border-white/30 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                          <i className="fas fa-eye"></i>
                          {language === 'es' ? 'Ver Demo Video' : 'View Demo Report'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CHAT INTERFACE - Always visible */}
                <div className="h-[500px]">
                  <ReportChat analysisContext={analysis || ''} language={language} mode={industrialMode} />
                </div>
              </div>

              {/* RIGHT COLUMN: DISPLAY & RESULTS */}
              <div className="lg:col-span-8 print:w-full print:col-span-12">
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

                        <button onClick={reset} className="w-12 h-12 flex items-center justify-center bg-cyber-dark text-cyber-purple border border-cyber-purple/30 rounded-xl hover:bg-cyber-purple hover:text-white shadow-lg transition-all print:hidden"><i className="fas fa-plus"></i></button>
                      </div>
                    </div>

                    {/* ACTIONS BAR - Layout Generation */}
                    <div className="bg-cyber-dark border border-white/5 rounded-2xl p-4 flex flex-col gap-4 print:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/50">
                            <i className="fas fa-layer-group text-cyber-blue"></i>
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Station Blueprint</h4>
                            <p className="text-xs text-zinc-500">AI-Generated Improvements</p>
                          </div>
                        </div>

                        {/* Upload Button - Always visible to add external image to PDF */}
                        <div className="flex items-center">
                          <input
                            type="file"
                            id="custom-blueprint-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadBlueprint}
                          />
                          {(!layoutImage || !isImageApproved) && (
                            <button
                              onClick={() => document.getElementById('custom-blueprint-upload')?.click()}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 rounded-lg text-xs font-bold uppercase hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              <i className="fas fa-file-pdf mr-2"></i>
                              AGREGAR IMAGEN GENERADA A PDF
                            </button>
                          )}
                          {isImageApproved && (
                            <span className="text-emerald-500 text-xs font-bold uppercase px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                              <i className="fas fa-check-circle mr-2"></i> Added to Report
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PROMPT GENERATION CONTROLS */}
                      <div className="flex flex-col gap-3 bg-black/20 p-3 rounded-xl border border-white/5">

                        {/* STYLE SELECTOR */}
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Visual Style:</label>
                          <select
                            value={promptStyle}
                            onChange={(e) => setPromptStyle(e.target.value as any)}
                            className="bg-black border border-white/10 text-white text-[10px] uppercase font-bold rounded px-2 py-1 outline-none focus:border-cyber-blue"
                          >
                            <option value="actual_feasible">🏭 Actual (Feasible)</option>
                            <option value="futuristic">🚀 Futuristic (Sci-Fi)</option>
                            <option value="blueprint">📐 Blueprint (Technical)</option>
                            <option value="hyper-realistic">🎬 Cinematic (Hyper-Real)</option>
                          </select>
                        </div>

                        {/* Always Visible Buttons */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-bold uppercase min-w-[120px]">Generate Prompt:</span>
                          <button
                            onClick={handleGeneratePrompt}
                            disabled={isGeneratingPrompt}
                            className={`flex-1 px-4 py-2 border rounded-lg text-xs font-bold uppercase transition-all ${promptType === 'image' ? 'bg-cyber-purple text-white border-cyber-purple' : 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/50 hover:bg-cyber-purple hover:text-white'}`}
                          >
                            {isGeneratingPrompt && promptType === 'image' ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-image mr-2"></i>}
                            IMAGE
                          </button>

                          <button
                            onClick={handleGenerateVideoPrompt}
                            disabled={isGeneratingPrompt}
                            className={`flex-1 px-4 py-2 border rounded-lg text-xs font-bold uppercase transition-all ${promptType === 'video' ? 'bg-pink-500 text-black border-pink-500' : 'bg-pink-500/10 text-pink-500 border-pink-500/50 hover:bg-pink-500 hover:text-white'}`}
                          >
                            {isGeneratingPrompt && promptType === 'video' ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-video mr-2"></i>}
                            VIDEO
                          </button>
                        </div>

                        {/* Prompt Result Display - Shows below */}
                        {layoutPrompt && (
                          <div className="animate-in fade-in slide-in-from-top-2 mt-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${promptType === 'video' ? 'text-pink-500' : 'text-cyber-blue'}`}>
                                {promptType === 'video' ? (
                                  <><i className="fas fa-video mr-1"></i> VIDEO PROMPT RESULT:</>
                                ) : (
                                  <><i className="fas fa-image mr-1"></i> IMAGE PROMPT RESULT:</>
                                )}
                              </span>
                            </div>
                            <div className="flex gap-2 items-stretch">
                              <textarea
                                readOnly
                                value={layoutPrompt}
                                className={`flex-1 bg-black/50 border rounded-lg p-3 text-[11px] text-cyber-text font-mono h-[80px] resize-none focus:outline-none ${promptType === 'video' ? 'border-pink-500/30 focus:border-pink-500/60' : 'border-cyber-blue/30 focus:border-cyber-blue/60'}`}
                              />
                              <button
                                onClick={copyPromptToClipboard}
                                className={`px-4 font-bold border rounded-lg hover:text-white transition-all text-sm ${promptType === 'video' ? 'bg-pink-500 text-black border-pink-500 hover:bg-pink-600' : 'bg-cyber-blue text-black border-cyber-blue hover:bg-cyan-400'}`}
                                title="Copy to Clipboard"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BLUEPRINT PREVIEW (Only if User Uploaded or Generated Internal) */}
                      {layoutImage && !isImageApproved && (
                        <div className="w-full mt-2 p-2 bg-black/40 rounded-xl border border-cyber-blue/30 relative animate-in fade-in">
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-cyber-blue text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Preview Mode</span>
                          </div>
                          <img src={layoutImage} className="w-full h-64 object-contain rounded-lg border border-white/10 bg-white/5" />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => setLayoutImage(null)}
                              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => setIsImageApproved(true)}
                              className="px-6 py-2 bg-emerald-500 text-black font-black border border-emerald-500 rounded-lg text-xs uppercase hover:bg-white hover:text-emerald-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            >
                              <i className="fas fa-check mr-2"></i> Approve & Add to Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <AnalysisDisplay
                      content={analysis}
                      images={files}
                      layoutVisualization={isImageApproved ? layoutImage : null}
                      videoUrl={originalVideoUrl}
                      methodAnalysis={methodAnalysis}
                      isImprovingMethod={isImprovingMethod}
                      onImproveMethod={handleImproveMethod}
                    />

                    {/* SAFETY COMPLIANCE REPORT */}
                    {safetyReport && (
                      <div className="mt-8">
                        <ComplianceReportDisplay report={safetyReport} />
                      </div>
                    )}
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

                      {/* TIMER DISPLAY */}
                      <div className="text-center">
                        <div className="text-6xl font-black text-white tabular-nums font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                          {elapsedTime.toFixed(1)}<span className="text-2xl text-cyber-blue">s</span>
                        </div>
                        <p className="text-[10px] text-cyber-text/50 uppercase tracking-[0.2em] mt-2">
                          {language === 'es' ? 'Tiempo de Inferencia Neural' : 'Neural Inference Time'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
        {showTour && (
          <div className="hidden md:block">
            <InteractiveTour
              language={language}
              onComplete={() => {
                setShowTour(false);
                localStorage.setItem('tour-completed', 'true');
              }}
            />
          </div>
        )}
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

const App: React.FC = () => {
  return (
    <SimulationProvider mode="automotive">
      <AppContent />
    </SimulationProvider>
  );
};

export default App;
