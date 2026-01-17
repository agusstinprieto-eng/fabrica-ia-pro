import React, { useState, useEffect } from 'react';

interface TourStep {
    targetId: string;
    titleEn: string;
    titleEs: string;
    contentEn: string;
    contentEs: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveTourProps {
    language: 'en' | 'es';
    onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'sidebar-dashboard',
        titleEn: 'Executive Dashboard',
        titleEs: 'Panel Ejecutivo',
        contentEn: 'Monitor your KPIs, efficiency (OEE), and AI-predicted risks in real-time.',
        contentEs: 'Monitorea tus KPIs, eficiencia (OEE) y riesgos predichos por IA en tiempo real.',
        position: 'right'
    },
    {
        targetId: 'sidebar-analysis',
        titleEn: 'Engineering Video Lab',
        titleEs: 'Laboratorio de Video',
        contentEn: 'This is the core. Here you upload videos for AI-assisted motion studies and methods analysis.',
        contentEs: 'Este es el núcleo. Aquí subes videos para estudios de tiempos y movimientos con IA.',
        position: 'right'
    },
    {
        targetId: 'industry-selector',
        titleEn: 'Industry Intelligence',
        titleEs: 'Inteligencia de Industria',
        contentEn: 'Highly specialized! Select your industry to apply specific engineering standards and quality compliance.',
        contentEs: '¡Especialización total! Selecciona tu industria para aplicar los estándares correctos y cumplimiento corporativo.',
        position: 'right'
    },
    {
        targetId: 'upload-area',
        titleEn: 'Data Ingestion',
        titleEs: 'Ingesta de Datos',
        contentEn: 'Drop your videos here. Once uploaded, click the "ANALYZE" button that will appear below.',
        contentEs: 'Arrastra tus videos aquí. Una vez cargados, haz clic en el botón "ANALIZAR" que aparecerá debajo.',
        position: 'top'
    },
    {
        targetId: 'sidebar-balancing',
        titleEn: 'Line Balance & Engineering',
        titleEs: 'Balanceo e Ingeniería',
        contentEn: 'Balance your production line! Drag operations to work stations and eliminate bottlenecks.',
        contentEs: '¡Balancea tu producción! Arrastra operaciones a las estaciones y elimina cuellos de botella.',
        position: 'right'
    },
    {
        targetId: 'sidebar-costing',
        titleEn: 'Cost Analysis',
        titleEs: 'Análisis de Costos',
        contentEn: 'Connect engineering data with costs to calculate ROI and project performance.',
        contentEs: 'Conecta los datos de ingeniería con los costos para calcular el ROI y desempeño.',
        position: 'right'
    }
];

const InteractiveTour: React.FC<InteractiveTourProps> = ({ language, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowSide: 'top' as 'top' | 'bottom' | 'left' | 'right' | 'none' });
    const [isVisible, setIsVisible] = useState(false);
    const step = TOUR_STEPS[currentStep];

    useEffect(() => {
        const updatePosition = () => {
            const el = document.getElementById(step.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                let top = 0;
                let left = 0;
                let arrowSide: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'top';

                const offset = 20;

                switch (step.position) {
                    case 'right':
                        top = rect.top + rect.height / 2;
                        left = rect.right + offset;
                        arrowSide = 'left';
                        break;
                    case 'bottom':
                        top = rect.bottom + offset;
                        left = rect.left + rect.width / 2;
                        arrowSide = 'top';
                        break;
                    case 'top':
                        top = rect.top - offset;
                        left = rect.left + rect.width / 2;
                        arrowSide = 'bottom';
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2;
                        left = rect.left - offset;
                        arrowSide = 'right';
                        break;
                }
                setTooltipPos({ top, left, arrowSide });
                setIsVisible(true);
            } else {
                // If target not found, we center it as a welcome message
                setTooltipPos({ top: window.innerHeight / 2, left: window.innerWidth / 2, arrowSide: 'none' });
                setIsVisible(true);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, step.targetId, step.position]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    if (!isVisible) return null;

    const translateStyles: React.CSSProperties = {
        top: `${tooltipPos.top}px`,
        left: `${tooltipPos.left}px`,
        transform: tooltipPos.arrowSide === 'left' ? 'translate(0, -50%)' :
            tooltipPos.arrowSide === 'right' ? 'translate(-100%, -50%)' :
                tooltipPos.arrowSide === 'top' ? 'translate(-50%, 0)' :
                    tooltipPos.arrowSide === 'bottom' ? 'translate(-50%, -100%)' :
                        'translate(-50%, -50%)' // center
    };

    const maskStyle = tooltipPos.arrowSide === 'none' ? 'none' : `radial-gradient(circle at ${tooltipPos.arrowSide === 'left' ? tooltipPos.left - 40 :
        tooltipPos.arrowSide === 'right' ? tooltipPos.left + 40 :
            tooltipPos.left
        }px ${tooltipPos.arrowSide === 'top' ? tooltipPos.top - 40 :
            tooltipPos.arrowSide === 'bottom' ? tooltipPos.top + 40 :
                tooltipPos.top
        }px, transparent 100px, black 120px)`;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dark Overlay with Circle Mask */}
            <div className="absolute inset-0 bg-black/60 pointer-events-auto transition-all duration-500" style={{
                WebkitMaskImage: maskStyle,
                maskImage: maskStyle
            }}></div>

            {/* Tooltip Card */}
            <div
                className="absolute pointer-events-auto bg-cyber-dark border border-cyber-blue shadow-[0_0_50px_rgba(0,240,255,0.4)] p-6 rounded-2xl w-80 animate-in fade-in zoom-in duration-300"
                style={translateStyles}
            >
                {/* Arrow */}
                {tooltipPos.arrowSide !== 'none' && (
                    <div className={`absolute w-4 h-4 bg-cyber-dark border-cyber-blue rotate-45 ${tooltipPos.arrowSide === 'left' ? '-left-2 top-1/2 -translate-y-1/2 border-l border-b' :
                        tooltipPos.arrowSide === 'right' ? '-right-2 top-1/2 -translate-y-1/2 border-r border-t' :
                            tooltipPos.arrowSide === 'top' ? '-top-2 left-1/2 -translate-x-1/2 border-l border-t' :
                                '-bottom-2 left-1/2 -translate-x-1/2 border-r border-b'
                        }`}></div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono text-cyber-blue font-black uppercase tracking-[0.2em] bg-cyber-blue/10 px-2 py-0.5 rounded border border-cyber-blue/20">
                        Step {currentStep + 1} / {TOUR_STEPS.length}
                    </span>
                    <button onClick={handleSkip} className="text-zinc-500 hover:text-white transition-colors text-xs uppercase font-black tracking-widest">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-3 flex items-center gap-2">
                    <i className="fas fa-info-circle text-cyber-blue text-sm"></i>
                    {language === 'es' ? step.titleEs : step.titleEn}
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">
                    {language === 'es' ? step.contentEs : step.contentEn}
                </p>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSkip}
                        className="px-4 py-3 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        {language === 'es' ? 'Omitir' : 'Skip'}
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-3 bg-cyber-blue text-black font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
                    >
                        {currentStep === TOUR_STEPS.length - 1 ? (language === 'es' ? 'Comenzar' : 'Get Started') : (language === 'es' ? 'Siguiente' : 'Next Step')}
                        <i className={`fas fa-chevron-right ${currentStep === TOUR_STEPS.length - 1 ? 'hidden' : ''}`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InteractiveTour;
