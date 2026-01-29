import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Plus, DollarSign, Download, Share2 } from 'lucide-react';
import { analyzeGarmentSample } from '../services/geminiQuoterService';
import { getAllSAMEntries, getAllLaborRates, calculateOperationCost, getSAMByCode } from '../services/samDatabase';
import { QuoterAnalysisResult, ConfirmedOperation, CostEstimate, SAMEntry, LaborRate } from '../types/quoter';

type ViewState = 'capture' | 'analyzing' | 'verification' | 'cost';

export const VisualQuoter: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('capture');
    const [analysisResult, setAnalysisResult] = useState<QuoterAnalysisResult | null>(null);
    const [confirmedOps, setConfirmedOps] = useState<ConfirmedOperation[]>([]);
    const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
    const [selectedCountry, setSelectedCountry] = useState('Mexico');
    const [processingTime, setProcessingTime] = useState(0);
    const [samDatabase, setSamDatabase] = useState<SAMEntry[]>([]);
    const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            const [sams, rates] = await Promise.all([
                getAllSAMEntries(),
                getAllLaborRates()
            ]);
            setSamDatabase(sams);
            setLaborRates(rates);
            setIsLoadingData(false);
        };
        loadData();
    }, []);

    React.useEffect(() => {
        if (viewState === 'analyzing') {
            setProcessingTime(0);
            timerRef.current = setInterval(() => {
                setProcessingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [viewState]);

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            setIsCameraActive(false);
            alert('Could not access the camera. Please check permissions.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                stopCamera();
                processImage(dataUrl);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async (base64: string) => {
        setViewState('analyzing');
        try {
            const pureBase64 = base64.split(',')[1];
            const result = await analyzeGarmentSample(pureBase64);

            setAnalysisResult(result);
            setConfirmedOps(result.operations.map(op => ({
                ...op,
                confirmed: op.confidence >= 0.7
            })));
            setViewState('verification');
        } catch (err) {
            console.error(err);
            alert('Error analyzing image. Please try with a clearer photo.');
            setViewState('capture');
        }
    };

    const toggleOperation = (samCode: string) => {
        setConfirmedOps(prev => prev.map(op =>
            op.samCode === samCode ? { ...op, confirmed: !op.confirmed } : op
        ));
    };

    const updateQuantity = (samCode: string, newQuantity: number) => {
        setConfirmedOps(prev => prev.map(op =>
            op.samCode === samCode ? { ...op, quantity: Math.max(1, newQuantity) } : op
        ));
    };

    const addCustomOperation = (samCode: string) => {
        const samEntry = getSAMByCode(samCode, samDatabase);
        if (!samEntry) return;

        const newOp: ConfirmedOperation = {
            name: samEntry.description,
            quantity: 1,
            confidence: 1.0,
            samCode: samEntry.code,
            category: samEntry.category,
            confirmed: true,
            manuallyAdded: true
        };

        setConfirmedOps(prev => [...prev, newOp]);
    };

    const calculateCost = () => {
        const laborRate = laborRates.find(r => r.country === selectedCountry);
        if (!laborRate) return;

        const activeOps = confirmedOps.filter(op => op.confirmed);
        let totalMinutes = 0;
        let totalCost = 0;

        activeOps.forEach(op => {
            const samEntry = getSAMByCode(op.samCode, samDatabase);
            if (samEntry) {
                const opMinutes = samEntry.baseMinutes * op.quantity * samEntry.difficulty;
                const opCost = calculateOperationCost(samEntry, op.quantity, laborRate);
                totalMinutes += opMinutes;
                totalCost += opCost;
            }
        });

        // Calculate comparisons
        const comparisons = laborRates
            .filter(r => r.country !== selectedCountry)
            .map(rate => {
                let compCost = 0;
                activeOps.forEach(op => {
                    const samEntry = getSAMByCode(op.samCode, samDatabase);
                    if (samEntry) {
                        compCost += calculateOperationCost(samEntry, op.quantity, rate);
                    }
                });
                return {
                    country: rate.country,
                    cost: compCost,
                    savingsPercent: Math.round(((totalCost - compCost) / totalCost) * 100)
                };
            })
            .sort((a, b) => a.cost - b.cost)
            .slice(0, 3);

        setCostEstimate({
            totalMinutes,
            laborCostUSD: totalCost,
            country: selectedCountry,
            operations: activeOps,
            comparisons
        });

        setViewState('cost');
    };

    const reset = () => {
        setViewState('capture');
        setAnalysisResult(null);
        setConfirmedOps([]);
        setCostEstimate(null);
    };

    // RENDER: Capture View
    if (viewState === 'capture') {
        return (
            <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Visual Quoter</h1>
                    <p className="text-gray-400">Photograph a sample and get the manufacturing cost instantly</p>
                </div>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                    {isCameraActive ? (
                        <div className="relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="mt-6 flex gap-4 justify-center">
                                <button
                                    onClick={stopCamera}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="px-8 py-3 bg-cyber-blue hover:bg-white text-black rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)] flex items-center gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    Capture
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-cyber-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                                <Camera className="w-12 h-12 text-cyber-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Capture Sample</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                Take a clear photo of the garment on a flat surface with good lighting
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={startCamera}
                                    className="px-6 py-3 bg-cyber-blue hover:bg-white text-black rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)] flex items-center gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    Use Camera
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload Photo
                                </button>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </>
                    )}
                </div>
            </div>
        );
    }

    // RENDER: Analyzing View
    if (viewState === 'analyzing') {
        return (
            <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-cyber-blue/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,243,255,0.4)]"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-black text-cyber-blue text-2xl drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">{processingTime}s</span>
                            <span className="text-[10px] font-bold text-cyber-blue/60 uppercase tracking-widest">Analyzing</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Detecting Operations...</h3>
                    <p className="text-gray-400">AI is identifying seams and processes</p>
                </div>
            </div>
        );
    }

    // RENDER: Verification View
    if (viewState === 'verification' && analysisResult) {
        const availableOps = samDatabase.filter(
            sam => !confirmedOps.some(op => op.samCode === sam.code)
        );

        return (
            <div className="max-w-6xl mx-auto p-6 h-full overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Verify Detected Operations</h1>
                    <p className="text-gray-400">Garment Type: <span className="text-cyber-blue font-semibold">{analysisResult.garmentType}</span></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Photo Preview */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                        <img src={analysisResult.imageUrl} alt="Garment" className="w-full rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-cyber-blue/20" />
                    </div>

                    {/* Operations List */}
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-h-[500px] overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-4">Operations ({confirmedOps.filter(op => op.confirmed).length})</h3>

                            {confirmedOps.map((op, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg mb-3 border ${op.confirmed
                                        ? 'bg-cyber-blue/10 border-cyber-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                                        : 'bg-gray-800/50 border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start gap-3 flex-1">
                                            <button
                                                onClick={() => toggleOperation(op.samCode)}
                                                className="mt-1"
                                            >
                                                {op.confirmed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-gray-500" />
                                                )}
                                            </button>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white text-sm">{op.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">Code: {op.samCode}</p>
                                                {op.confidence < 0.7 && (
                                                    <span className="text-xs text-yellow-500 mt-1 block">
                                                        ⚠️ Low confidence - Verify
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs text-gray-400">Quantity:</span>
                                        <button
                                            onClick={() => updateQuantity(op.samCode, op.quantity - 1)}
                                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-bold text-white">{op.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(op.samCode, op.quantity + 1)}
                                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Custom Operation */}
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h4 className="text-sm font-bold text-gray-400 mb-3">Add Operation</h4>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addCustomOperation(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                                >
                                    <option value="">Select...</option>
                                    {availableOps.map(sam => (
                                        <option key={sam.code} value={sam.code}>
                                            {sam.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Country Selection */}
                        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-3">Manufacturing Country</h3>
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-medium"
                            >
                                {laborRates.map(rate => (
                                    <option key={rate.country} value={rate.country}>
                                        {rate.country} (${rate.hourlyRate}/hr)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={reset}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={calculateCost}
                                disabled={confirmedOps.filter(op => op.confirmed).length === 0}
                                className="flex-1 px-6 py-3 bg-cyber-blue hover:bg-white disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-black rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)] flex items-center justify-center gap-2"
                            >
                                <DollarSign className="w-5 h-5" />
                                Calculate Cost
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: Cost Card View
    if (viewState === 'cost' && costEstimate) {
        return (
            <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto custom-scrollbar">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-6">
                    <h1 className="text-3xl font-black mb-2">ESTIMATED MANUFACTURING COST</h1>
                    <p className="text-blue-100">Based on {costEstimate.operations.length} confirmed operations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Main Cost */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Total Sewing Time</h3>
                        <div className="text-5xl font-black text-white mb-2">{costEstimate.totalMinutes.toFixed(1)}</div>
                        <p className="text-gray-400">minutes</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-8 text-white">
                        <h3 className="text-sm font-bold text-green-100 mb-4 uppercase tracking-wider">Labor Cost ({costEstimate.country})</h3>
                        <div className="text-5xl font-black mb-2">${costEstimate.laborCostUSD.toFixed(2)}</div>
                        <p className="text-green-100">USD per unit</p>
                    </div>
                </div>

                {/* Comparisons */}
                {costEstimate.comparisons && costEstimate.comparisons.length > 0 && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Global Comparison</h3>
                        <div className="space-y-3">
                            {costEstimate.comparisons.map((comp, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                    <div>
                                        <h4 className="font-semibold text-white">{comp.country}</h4>
                                        <p className="text-sm text-gray-400">${comp.cost.toFixed(2)} USD</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg font-bold ${comp.savingsPercent > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {comp.savingsPercent > 0 ? '+' : ''}{comp.savingsPercent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Operations Breakdown */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Operations Breakdown</h3>
                    <div className="space-y-2">
                        {costEstimate.operations.map((op, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg text-sm">
                                <span className="text-gray-300">{op.name} (x{op.quantity})</span>
                                <span className="text-gray-400">{op.samCode}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={reset}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                        New Quote
                    </button>
                    <button
                        onClick={() => alert('PDF Export feature coming soon')}
                        className="flex-1 px-6 py-3 bg-cyber-blue hover:bg-white text-black rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)] flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Export PDF
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
