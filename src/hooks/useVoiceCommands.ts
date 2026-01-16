import { useEffect, useState } from 'react';

type ViewType = 'dashboard' | 'analysis' | 'balancing' | 'costing' | 'regional' | 'library' | 'gallery' | 'settings';

export const useVoiceCommands = (
    onNavigate: (view: ViewType) => void,
    language: 'es' | 'en'
) => {
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState('');

    useEffect(() => {
        // Standard Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = language === 'es' ? 'es-MX' : 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            setLastCommand(transcript);

            // Command logic
            if (transcript.includes('dashboard') || transcript.includes('tablero') || transcript.includes('inicio')) {
                onNavigate('dashboard');
            } else if (transcript.includes('analysis') || transcript.includes('laboratorio') || transcript.includes('analizar')) {
                onNavigate('analysis');
            } else if (transcript.includes('balancing') || transcript.includes('balanceo') || transcript.includes('línea')) {
                onNavigate('balancing');
            } else if (transcript.includes('costing') || transcript.includes('costos')) {
                onNavigate('costing');
            } else if (transcript.includes('library') || transcript.includes('biblioteca') || transcript.includes('hub')) {
                onNavigate('library');
            } else if (transcript.includes('gallery') || transcript.includes('galería') || transcript.includes('fotos')) {
                onNavigate('gallery');
            } else if (transcript.includes('settings') || transcript.includes('configuración')) {
                onNavigate('settings');
            }
        };

        // Start listening immediately
        try {
            recognition.start();
        } catch (e) {
            console.warn('Speech recognition already started or not supported');
        }

        return () => recognition.stop();
    }, [onNavigate, language]);

    return { isListening, lastCommand };
};
