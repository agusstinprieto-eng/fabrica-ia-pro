import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top - 10, // 10px spacing above element
                left: rect.left + rect.width / 2
            });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsVisible(true);
    };

    // Update position on scroll/resize just in case
    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible]);

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600 text-slate-200 text-xs rounded-xl shadow-2xl p-4 w-72 md:w-96 max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
                        {content}
                        {/* Arrow (Visual only, tricky with fixed pos so simplified) */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-600"></div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
