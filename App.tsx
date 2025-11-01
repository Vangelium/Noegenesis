import React, { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import ControlsUI from './components/ControlsUI';
import StartExperienceButton from './components/StartExperienceButton';
import { SettingsIcon } from './components/Icons';
import { RotationControls, RotationAxis, BodyVisibility, FractalType, BaseGeometry } from './types';
import MathHUD from './components/MathHUD';

const PRESET_STORAGE_KEY = 'noegenesis-preset';

const defaultControlsState = {
    depth: 3,
    fov: 75,
    speed: 20,
    baseGeometry: 'icosahedron' as BaseGeometry,
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
    isShadowView: false,
    isMathHUDVisible: true,
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
    const [baseGeometry, setBaseGeometry] = useState<BaseGeometry>(initialState.baseGeometry);
    const [fractalType, setFractalType] = useState<FractalType>(initialState.fractalType);
    const [rotationAxis, setRotationAxis] = useState<RotationAxis>(initialState.rotationAxis);
    const [rotationControls, setRotationControls] = useState<RotationControls>(initialState.rotationControls);
    const [isDopplerEffect, setIsDopplerEffect] = useState(initialState.isDopplerEffect);
    const [isPixelView, setIsPixelView] = useState(initialState.isPixelView);
    const [bodyVisibility, setBodyVisibility] = useState<BodyVisibility>(initialState.bodyVisibility);
    const [isShadowView, setIsShadowView] = useState(initialState.isShadowView);
    const [isMathHUDVisible, setIsMathHUDVisible] = useState(initialState.isMathHUDVisible);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const animationTargetDepth = useRef(0);

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
            depth, fov, speed, baseGeometry, fractalType, rotationAxis,
            rotationControls, isDopplerEffect, isPixelView, bodyVisibility,
            isShadowView, isMathHUDVisible,
        };
        try {
            localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(settings));
            showNotification('Ajustes guardados!');
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
            showNotification('Error al guardar los ajustes.');
        }
    };

    const handleToggleAndSaveUI = () => {
        if (isUIVisible) {
            handleSaveSettings();
        }
        setIsUIVisible(prev => !prev);
    };

    const handleResetSettings = () => {
        localStorage.removeItem(PRESET_STORAGE_KEY);
        setDepth(defaultControlsState.depth);
        setFov(defaultControlsState.fov);
        setSpeed(defaultControlsState.speed);
        setBaseGeometry(defaultControlsState.baseGeometry);
        setFractalType(defaultControlsState.fractalType);
        setRotationAxis(defaultControlsState.rotationAxis);
        setRotationControls(defaultControlsState.rotationControls);
        setIsDopplerEffect(defaultControlsState.isDopplerEffect);
        setIsPixelView(defaultControlsState.isPixelView);
        setBodyVisibility(defaultControlsState.bodyVisibility);
        setIsShadowView(defaultControlsState.isShadowView);
        setIsMathHUDVisible(defaultControlsState.isMathHUDVisible);
        showNotification('Ajustes restaurados a los valores por defecto.');
        setIsUIVisible(true);
    };

    const handlePlayAnimation = useCallback(() => {
        if (isAnimating) return;
        animationTargetDepth.current = depth;
        setIsAnimating(true);
        setDepth(0);
    }, [depth, isAnimating]);

    useEffect(() => {
        if (!isAnimating) return;

        if (depth < animationTargetDepth.current) {
            const timer = setTimeout(() => {
                setDepth(prevDepth => prevDepth + 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isAnimating, depth]);

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
                baseGeometry={baseGeometry}
                fractalType={fractalType}
                rotationAxis={rotationAxis}
                rotationControls={rotationControls}
                isDopplerEffect={isDopplerEffect}
                isPixelView={isPixelView}
                bodyVisibility={bodyVisibility}
                isShadowView={isShadowView}
            />

            {!isExperienceStarted && <StartExperienceButton onClick={handleStartExperience} />}
            
            {isExperienceStarted && (
                <button
                    onClick={handleToggleAndSaveUI}
                    className="absolute top-5 right-5 z-20 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                    title="Guardar y Ocultar Controles (H para alternar)"
                >
                    <SettingsIcon />
                </button>
            )}

            <ControlsUI
                isVisible={isUIVisible}
                depth={depth}
                setDepth={(newDepth) => !isAnimating && setDepth(newDepth)}
                fov={fov}
                setFov={setFov}
                speed={speed}
                setSpeed={setSpeed}
                baseGeometry={baseGeometry}
                setBaseGeometry={setBaseGeometry}
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
                isShadowView={isShadowView}
                setIsShadowView={setIsShadowView}
                isMathHUDVisible={isMathHUDVisible}
                setIsMathHUDVisible={setIsMathHUDVisible}
                onResetSettings={handleResetSettings}
                isAnimating={isAnimating}
                onPlayAnimation={handlePlayAnimation}
            />

            <MathHUD 
                isVisible={isMathHUDVisible}
                baseGeometry={baseGeometry}
                fractalType={fractalType}
                depth={depth}
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