import React, { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import ControlsUI from './components/ControlsUI';
import StartExperienceButton from './components/StartExperienceButton';
import { SettingsIcon } from './components/Icons';
import { RotationControls, RotationAxis, BodyVisibility, FractalType } from './types';

const PRESET_STORAGE_KEY = 'noegenesis-preset';

const defaultControlsState = {
    depth: 3,
    fov: 75,
    speed: 20,
    fractalType: 'noegenesis' as FractalType,
    rotationAxis: 'both' as RotationAxis,
    rotationControls: {
        principal: true,
        interior: true,
        exterior: true,
    },
    isDopplerEffect: false,
    isPixelView: false,
    bodyVisibility: {
        principal: true,
        interior: true,
        exterior: true,
    },
};

const getInitialState = () => {
    try {
        const savedState = localStorage.getItem(PRESET_STORAGE_KEY);
        if (savedState) {
            // Merge saved state with defaults to ensure all keys are present
            return { ...defaultControlsState, ...JSON.parse(savedState) };
        }
    } catch (error) {
        console.error("Failed to parse saved state from localStorage:", error);
    }
    return defaultControlsState;
};


const App: React.FC = () => {
    const [isExperienceStarted, setIsExperienceStarted] = useState(false);
    const [isUIVisible, setIsUIVisible] = useState(true);

    const [initialState] = useState(getInitialState);

    // Scene and UI state
    const [depth, setDepth] = useState(initialState.depth);
    const [fov, setFov] = useState(initialState.fov);
    const [speed, setSpeed] = useState(initialState.speed);
    const [fractalType, setFractalType] = useState<FractalType>(initialState.fractalType);
    const [rotationAxis, setRotationAxis] = useState<RotationAxis>(initialState.rotationAxis);
    const [rotationControls, setRotationControls] = useState<RotationControls>(initialState.rotationControls);
    const [isDopplerEffect, setIsDopplerEffect] = useState(initialState.isDopplerEffect);
    const [isPixelView, setIsPixelView] = useState(initialState.isPixelView);
    const [bodyVisibility, setBodyVisibility] = useState<BodyVisibility>(initialState.bodyVisibility);

    const [notification, setNotification] = useState('');
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const notificationTimer = useRef<number>();
    
    const bgMusicRef = useRef<HTMLAudioElement>(null);
    const voiceOverRef = useRef<HTMLAudioElement>(null);

    const showNotification = (message: string) => {
        clearTimeout(notificationTimer.current);
        setNotification(message);
        setIsNotificationVisible(true);
        notificationTimer.current = window.setTimeout(() => {
            setIsNotificationVisible(false);
        }, 2500);
    };

    const handleStartExperience = () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.currentTime = 0;
            bgMusicRef.current.volume = 1.0;
            bgMusicRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
        if (voiceOverRef.current) {
            voiceOverRef.current.currentTime = 0;
            voiceOverRef.current.volume = 1.0;
            voiceOverRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
        setIsExperienceStarted(true);
    };
    
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.code === 'KeyH') {
            setIsUIVisible(prev => !prev);
        }
    }, []);

    const handleSaveSettings = () => {
        const settings = {
            depth, fov, speed, fractalType, rotationAxis,
            rotationControls, isDopplerEffect, isPixelView, bodyVisibility
        };
        try {
            localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(settings));
            showNotification('Ajustes guardados!');
            setIsUIVisible(false);
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
            showNotification('Error al guardar los ajustes.');
        }
    };

    const handleResetSettings = () => {
        localStorage.removeItem(PRESET_STORAGE_KEY);
        setDepth(defaultControlsState.depth);
        setFov(defaultControlsState.fov);
        setSpeed(defaultControlsState.speed);
        setFractalType(defaultControlsState.fractalType);
        setRotationAxis(defaultControlsState.rotationAxis);
        setRotationControls(defaultControlsState.rotationControls);
        setIsDopplerEffect(defaultControlsState.isDopplerEffect);
        setIsPixelView(defaultControlsState.isPixelView);
        setBodyVisibility(defaultControlsState.bodyVisibility);
        showNotification('Ajustes restaurados a los valores por defecto.');
        setIsUIVisible(true);
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        if ((fractalType === 'koch' || fractalType === 'mandelbrot' || fractalType === 'julia' || fractalType === 'hybrid') && depth > 4) {
            setDepth(4);
        }
    }, [fractalType, depth]);

    return (
        <div className="w-screen h-screen bg-black text-white font-sans overflow-hidden">
            <Scene
                depth={depth}
                fov={fov}
                speed={speed}
                fractalType={fractalType}
                rotationAxis={rotationAxis}
                rotationControls={rotationControls}
                isDopplerEffect={isDopplerEffect}
                isPixelView={isPixelView}
                bodyVisibility={bodyVisibility}
            />

            {!isExperienceStarted && <StartExperienceButton onClick={handleStartExperience} />}
            
            {isExperienceStarted && (
                <button
                    onClick={() => setIsUIVisible(prev => !prev)}
                    className="absolute top-5 right-5 z-20 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                    title="Mostrar/Ocultar Controles (H)"
                >
                    <SettingsIcon />
                </button>
            )}

            <ControlsUI
                isVisible={isUIVisible}
                depth={depth}
                setDepth={setDepth}
                fov={fov}
                setFov={setFov}
                speed={speed}
                setSpeed={setSpeed}
                fractalType={fractalType}
                setFractalType={setFractalType}
                rotationAxis={rotationAxis}
                setRotationAxis={setRotationAxis}
                rotationControls={rotationControls}
                setRotationControls={setRotationControls}
                isDopplerEffect={isDopplerEffect}
                setIsDopplerEffect={setIsDopplerEffect}
                isPixelView={isPixelView}
                setIsPixelView={setIsPixelView}
                setBodyVisibility={setBodyVisibility}
                onSaveSettings={handleSaveSettings}
                onResetSettings={handleResetSettings}
            />
            
             <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-6 py-3 rounded-lg shadow-lg border border-white/10 transition-opacity duration-300 ease-in-out ${isNotificationVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {notification}
            </div>

            <audio ref={bgMusicRef} loop preload="auto">
                <source src="Neogenesis.mp3" type="audio/mpeg" />
            </audio>
            <audio ref={voiceOverRef} preload="auto">
                <source src="Neogenesis (1).mp3" type="audio/mpeg" />
            </audio>
        </div>
    );
};

export default App;