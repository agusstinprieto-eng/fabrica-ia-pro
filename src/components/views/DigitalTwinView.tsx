import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid, PerspectiveCamera, Environment, ContactShadows, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface DigitalTwinViewProps {
    analysis: any;
    onClose: () => void;
}

const MachineStation = ({ position, label, status, cycleTime }: { position: [number, number, number], label: string, status: 'idle' | 'working' | 'error', cycleTime: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current && status === 'working') {
            const t = state.clock.getElapsedTime();
            meshRef.current.position.y = position[1] + Math.sin(t * (10 / (cycleTime || 1))) * 0.05;
        }
    });

    const color = status === 'working' ? '#00f3ff' : (status === 'error' ? '#ef4444' : '#6366f1');

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                {/* Machine Body - Cyber Style */}
                <mesh ref={meshRef} castShadow receiveShadow>
                    <boxGeometry args={[1.2, 1.8, 1.2]} />
                    <meshStandardMaterial
                        color={color}
                        roughness={0.2}
                        metalness={0.9}
                        emissive={color}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Cyber Accents */}
                <mesh position={[0, 0, 0.61]} castShadow receiveShadow>
                    <planeGeometry args={[0.8, 1.2]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[0, 0, 0.62]}>
                    <planeGeometry args={[0.6, 1]} />
                    <meshBasicMaterial color={color} wireframe />
                </mesh>
            </Float>

            {/* Base holograms */}
            <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Label */}
            <group position={[0, 2.2, 0]}>
                <Text
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {label.toUpperCase()}
                </Text>
                <Text
                    position={[0, -0.3, 0]}
                    fontSize={0.15}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {cycleTime.toFixed(1)}s / CYCLE
                </Text>
            </group>

            {/* Connecting Lines */}
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 10, 8]} />
                <meshBasicMaterial color="#1e293b" opacity={0.5} transparent />
            </mesh>
        </group>
    );
};

const ProductionLine = ({ analysis }: { analysis: any }) => {
    // Generate stations based on the analysis or default to a demo set
    const stations = useMemo(() => {
        if (!analysis || !analysis.cycle_analysis) {
            return [
                { id: 1, label: 'INPUT', position: [-6, 1, 0], status: 'working', cycleTime: 2.5 },
                { id: 2, label: 'ASSEMBLY', position: [-2, 1, 0], status: 'working', cycleTime: 5.0 },
                { id: 3, label: 'WELDING', position: [2, 1, 0], status: 'working', cycleTime: 4.2 },
                { id: 4, label: 'QC & PACK', position: [6, 1, 0], status: 'working', cycleTime: 3.0 },
            ];
        }

        // Map analysis steps to 3D stations
        return analysis.cycle_analysis.map((step: any, idx: number) => ({
            id: idx,
            label: step.element.substring(0, 10),
            position: [(idx - analysis.cycle_analysis.length / 2) * 4, 1, 0] as [number, number, number],
            status: 'working',
            cycleTime: step.time_seconds || 5
        }));
    }, [analysis]);

    return (
        <group>
            {/* Conveyor Belt - Cyber Pathway */}
            <mesh position={[0, 0.1, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 1.5]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Animated Energy Flow on Belt (Simple version) */}
            <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 0.1]} />
                <meshBasicMaterial color="#00f3ff" transparent opacity={0.5} />
            </mesh>

            {/* Rails */}
            <mesh position={[0, 0.2, 0.8]} rotation={[0, 0, 0]}>
                <boxGeometry args={[20, 0.2, 0.1]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.2, -0.8]} rotation={[0, 0, 0]}>
                <boxGeometry args={[20, 0.2, 0.1]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Stations */}
            {stations.map((station: any) => (
                <MachineStation
                    key={station.id}
                    position={station.position as [number, number, number]}
                    label={station.label}
                    status={station.status}
                    cycleTime={station.cycleTime}
                />
            ))}
        </group>
    );
};

const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ analysis, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col w-screen h-screen">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/50 box-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        <i className="fas fa-cube text-blue-400 text-xl animate-pulse"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-widest font-mono">DIGITAL<span className="text-blue-500">TWIN</span></h1>
                        <p className="text-blue-300/60 text-[10px] uppercase tracking-[0.2em]">Real-time Process Simulation</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-lg flex gap-8 border border-white/10">
                        <div className="flex flex-col items-center">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider">System Status</span>
                            <span className="text-emerald-400 font-bold font-mono text-sm shadow-emerald-500/50">ONLINE</span>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Cycle Time</span>
                            <span className="text-blue-400 font-bold font-mono text-sm">{analysis?.time_calculation?.standard_time || '0.00'}s</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-white flex items-center justify-center border border-red-500/30 transition-all hover:scale-110"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
            </div>

            {/* 3D Scene */}
            <div className="flex-1 w-full h-full relative cursor-move">
                <Canvas shadows gl={{ antialias: true }} camera={{ position: [8, 8, 12], fov: 45 }}>
                    <color attach="background" args={['#020617']} />

                    {/* Camera Controls */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        maxPolarAngle={Math.PI / 2.1}
                        makeDefault
                    />

                    {/* Environment & Lighting */}
                    <ambientLight intensity={0.5} color="#4f46e5" />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f3ff" castShadow />
                    <spotLight
                        position={[-10, 20, -10]}
                        angle={0.3}
                        penumbra={1}
                        intensity={2}
                        castShadow
                        color="#f472b6"
                    />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Environment preset="city" />
                    <fog attach="fog" args={['#020617', 10, 50]} />

                    {/* Scene Content */}
                    <ProductionLine analysis={analysis} />

                    {/* Cyber Floor */}
                    <Grid
                        position={[0, -0.01, 0]}
                        args={[40, 40]}
                        cellColor="#1e293b"
                        sectionColor="#3b82f6"
                        sectionThickness={1.5}
                        cellThickness={0.5}
                        fadeDistance={25}
                        fadeStrength={1}
                    />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.8} />
                    </mesh>

                    {/* Reflections */}
                    <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
                </Canvas>

                {/* Footer HUD */}
                <div className="absolute bottom-8 left-8 pointer-events-none">
                    <div className="glass-panel p-4 rounded-xl pointer-events-auto bg-black/40 backdrop-blur border border-white/5">
                        <h3 className="text-blue-400 text-[10px] font-bold uppercase mb-2 tracking-wider">Simulation Interface</h3>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 text-xs rounded transition-all uppercase font-bold tracking-wider">
                                <i className="fas fa-play mr-2"></i> Run
                            </button>
                            <button className="px-4 py-1.5 bg-slate-700/20 hover:bg-slate-700/40 border border-white/10 text-slate-300 text-xs rounded transition-all uppercase font-bold tracking-wider">
                                <i className="fas fa-pause mr-2"></i> Pause
                            </button>
                            <button className="px-4 py-1.5 bg-slate-700/20 hover:bg-slate-700/40 border border-white/10 text-slate-300 text-xs rounded transition-all uppercase font-bold tracking-wider">
                                <i className="fas fa-undo mr-2"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalTwinView;
