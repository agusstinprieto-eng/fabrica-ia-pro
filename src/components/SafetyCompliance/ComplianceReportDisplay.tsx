import React from 'react';
import { ComplianceReport } from '../../types/safety';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Shield } from 'lucide-react';

interface ComplianceReportProps {
    report: ComplianceReport;
}

export const ComplianceReportDisplay: React.FC<ComplianceReportProps> = ({ report }) => {
    const getComplianceColor = (rate: number) => {
        if (rate >= 95) return 'text-green-500 bg-green-500/10 border-green-500/30';
        if (rate >= 80) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
        if (rate >= 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        return 'text-red-500 bg-red-500/10 border-red-500/30';
    };

    const getComplianceIcon = (rate: number) => {
        if (rate >= 95) return <CheckCircle className="w-8 h-8 text-green-500" />;
        if (rate >= 80) return <TrendingUp className="w-8 h-8 text-yellow-500" />;
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    };

    const ppeLabels: Record<string, string> = {
        safety_glasses: 'Safety Glasses',
        helmet: 'Safety Helmet',
        gloves: 'Safety Gloves',
        mask: 'Face Mask'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-2xl font-black uppercase tracking-wider">Safety Compliance Report</h2>
                </div>
                <p className="text-blue-100 text-sm">PPE Item: {ppeLabels[report.ppeItem]}</p>
                <p className="text-blue-200 text-xs mt-1">
                    Analyzed {report.totalFramesAnalyzed} frames • {new Date(report.analysisTimestamp).toLocaleString()}
                </p>
            </div>

            {/* Compliance Rate Card */}
            <div className={`rounded-xl border-2 p-8 text-center ${getComplianceColor(report.complianceRate)}`}>
                <div className="flex justify-center mb-4">
                    {getComplianceIcon(report.complianceRate)}
                </div>
                <div className="text-6xl font-black mb-2">{report.complianceRate}%</div>
                <p className="text-sm font-bold uppercase tracking-wider opacity-80">Compliance Rate</p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold text-gray-400 uppercase">Total Workers</h3>
                    </div>
                    <div className="text-4xl font-black text-white">{report.totalWorkersDetected}</div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-green-500/30 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <h3 className="text-sm font-bold text-gray-400 uppercase">Compliant</h3>
                    </div>
                    <div className="text-4xl font-black text-green-500">{report.workersCompliant}</div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-red-500/30 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <h3 className="text-sm font-bold text-gray-400 uppercase">Non-Compliant</h3>
                    </div>
                    <div className="text-4xl font-black text-red-500">{report.workersNonCompliant}</div>
                </div>
            </div>

            {/* Violations Section */}
            {report.violations.length > 0 && (
                <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-red-500 uppercase">Violations Detected ({report.violations.length})</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {report.violations.map((violation, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-lg border border-red-500/20 overflow-hidden">
                                <img
                                    src={violation.frameUrl}
                                    alt={`Violation at ${violation.timestamp}s`}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-red-400">
                                            {Math.floor(violation.timestamp / 60)}:{String(Math.floor(violation.timestamp % 60)).padStart(2, '0')}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {Math.round(violation.confidence * 100)}% confidence
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">{violation.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Position: {violation.workerPosition}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white uppercase mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Recommendations
                </h3>
                <ul className="space-y-3">
                    {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                            <span className="text-blue-400 font-bold mt-0.5">•</span>
                            <span>{rec}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Export Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => alert('PDF export feature coming soon')}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Download Compliance Certificate
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Report
                </button>
            </div>
        </div>
    );
};
