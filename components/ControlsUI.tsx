import React from 'react';
import { RotationControls, RotationAxis, BodyVisibility, FractalType } from '../types';
import { FullscreenIcon, SaveIcon, ResetIcon } from './Icons';

interface ControlsUIProps {
    isVisible: boolean;
    depth: number;
    setDepth: (value: number) => void;
    fov: number;
    setFov: (value: number) => void;
    speed: number;
    setSpeed: (value: number) => void;
    fractalType: FractalType;
    setFractalType: (value: FractalType) => void;
    rotationAxis: RotationAxis;
    setRotationAxis: (value: RotationAxis) => void;
    rotationControls: RotationControls;
    setRotationControls: (value: RotationControls) => void;
    isDopplerEffect: boolean;
    setIsDopplerEffect: (value: boolean) => void;
    isPixelView: boolean;
    setIsPixelView: (value: boolean) => void;
    setBodyVisibility: (value: BodyVisibility) => void;
    onSaveSettings: () => void;
    onResetSettings: () => void;
}

const ControlCheckbox: React.FC<{id: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({id, label, checked, onChange}) => (
    <div className="flex items-center gap-2">
        <input type="checkbox" id={id} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-600 cursor-pointer" />
        <label htmlFor={id} className="text-sm text-gray-300 cursor-pointer">{label}</label>
    </div>
);

const ControlRadio: React.FC<{id: string, name: string, value: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({id, name, value, label, checked, onChange}) => (
     <div className="flex items-center gap-2">
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-600 cursor-pointer" />
        <label htmlFor={id} className="text-sm text-gray-300 cursor-pointer">{label}</label>
    </div>
);

const ControlsUI: React.FC<ControlsUIProps> = ({
    isVisible, depth, setDepth, fov, setFov, speed, setSpeed, fractalType, setFractalType, rotationAxis, setRotationAxis,
    rotationControls, setRotationControls, isDopplerEffect, setIsDopplerEffect, isPixelView,
    setIsPixelView, setBodyVisibility, onSaveSettings, onResetSettings
}) => {
    
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const maxDepth = (fractalType === 'koch' || fractalType === 'mandelbrot' || fractalType === 'julia' || fractalType === 'hybrid') ? 4 : 10;
    
    return (
        <aside className={`absolute top-0 left-0 p-5 bg-black/70 border-b border-r border-gray-800/50 rounded-br-2xl max-w-sm max-h-[95vh] overflow-y-auto transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-orange-400">Noegenesis</h1>
                <button onClick={handleToggleFullscreen} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Toggle Fullscreen">
                    <FullscreenIcon />
                </button>
            </div>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Tipo de Fractal:</p>
                    <div className="flex gap-4 flex-wrap">
                        <ControlRadio id="fractal-noegenesis" name="fractal-type" value="noegenesis" label="Noegenesis" checked={fractalType === 'noegenesis'} onChange={(e) => setFractalType(e.target.value as FractalType)} />
                        <ControlRadio id="fractal-koch" name="fractal-type" value="koch" label="Koch" checked={fractalType === 'koch'} onChange={(e) => setFractalType(e.target.value as FractalType)} />
                        <ControlRadio id="fractal-mandelbrot" name="fractal-type" value="mandelbrot" label="Mandelbrot" checked={fractalType === 'mandelbrot'} onChange={(e) => setFractalType(e.target.value as FractalType)} />
                        <ControlRadio id="fractal-julia" name="fractal-type" value="julia" label="Julia" checked={fractalType === 'julia'} onChange={(e) => setFractalType(e.target.value as FractalType)} />
                        <ControlRadio id="fractal-hybrid" name="fractal-type" value="hybrid" label="Híbrido" checked={fractalType === 'hybrid'} onChange={(e) => setFractalType(e.target.value as FractalType)} />
                    </div>
                </div>

                <div>
                    <label htmlFor="depth-slider" className="block mb-1 text-sm font-medium text-gray-300">Nivel de detalle: <span className="font-bold text-white">{depth}</span></label>
                    <input type="range" id="depth-slider" min="0" max={maxDepth} value={depth} step="1" onChange={(e) => setDepth(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>
                
                <div>
                    <label htmlFor="fov-slider" className="block mb-1 text-sm font-medium text-gray-300">Campo de Visión (Zoom): <span className="font-bold text-white">{fov}</span></label>
                    <input type="range" id="fov-slider" min="10" max="90" value={fov} step="1" onChange={(e) => setFov(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>

                <div>
                    <label htmlFor="speed-slider" className="block mb-1 text-sm font-medium text-gray-300">Velocidad de rotación auto: <span className="font-bold text-white">{speed}</span></label>
                    <input type="range" id="speed-slider" min="0" max="200" value={speed} step="1" onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>
                
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Ver cuerpo:</p>
                     <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setBodyVisibility({ principal: true, interior: true, exterior: true })} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Todos</button>
                         <button onClick={() => setBodyVisibility({ principal: true, interior: false, exterior: false })} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Principal</button>
                         <button onClick={() => setBodyVisibility({ principal: false, interior: true, exterior: false })} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Interior</button>
                         <button onClick={() => setBodyVisibility({ principal: false, interior: false, exterior: true })} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Exterior</button>
                     </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Eje de rotación auto:</p>
                    <div className="flex gap-4">
                        <ControlRadio id="rot-both" name="rotation-axis" value="both" label="Ambos" checked={rotationAxis === 'both'} onChange={(e) => setRotationAxis(e.target.value as RotationAxis)} />
                        <ControlRadio id="rot-horizontal" name="rotation-axis" value="horizontal" label="Horizontal" checked={rotationAxis === 'horizontal'} onChange={(e) => setRotationAxis(e.target.value as RotationAxis)} />
                        <ControlRadio id="rot-vertical" name="rotation-axis" value="vertical" label="Vertical" checked={rotationAxis === 'vertical'} onChange={(e) => setRotationAxis(e.target.value as RotationAxis)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Control de Rotación Auto:</p>
                    <div className="flex gap-4">
                        <ControlCheckbox id="rot-principal" label="Principal" checked={rotationControls.principal} onChange={(e) => setRotationControls({...rotationControls, principal: e.target.checked})} />
                        <ControlCheckbox id="rot-interior" label="Interior" checked={rotationControls.interior} onChange={(e) => setRotationControls({...rotationControls, interior: e.target.checked})} />
                        <ControlCheckbox id="rot-exterior" label="Exterior" checked={rotationControls.exterior} onChange={(e) => setRotationControls({...rotationControls, exterior: e.target.checked})} />
                    </div>
                </div>

                 <div className="flex flex-col space-y-2 pt-2 border-t border-gray-700/50">
                     <ControlCheckbox id="doppler-checkbox" label="Activar Efecto Doppler" checked={isDopplerEffect} onChange={(e) => setIsDopplerEffect(e.target.checked)} />
                     <ControlCheckbox id="pixel-view-checkbox" label="Vista Microscópica" checked={isPixelView} onChange={(e) => setIsPixelView(e.target.checked)} />
                 </div>

                <div className="pt-2 border-t border-gray-700/50">
                    <p className="text-sm font-medium text-gray-300 mb-2">Ajustes</p>
                    <div className="flex items-center gap-2">
                        <button onClick={onSaveSettings} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" title="Guardar ajustes actuales">
                            <SaveIcon />
                            Guardar
                        </button>
                        <button onClick={onResetSettings} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" title="Restaurar ajustes por defecto">
                            <ResetIcon />
                            Reiniciar
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-700/50 text-xs text-gray-400 space-y-1">
                    <p className="font-bold text-gray-300">Controles de Vuelo:</p>
                    <p>Click para controlar. <strong className="text-white">ESC</strong> para liberar.</p>
                    <p><strong className="text-white">WASD:</strong> Moverse</p>
                    <p><strong className="text-white">Q/E:</strong> Rotar (Alabeo)</p>
                    <p><strong className="text-white">Ratón:</strong> Mirar</p>
                    <p><strong className="text-white">Deslizar:</strong> Mirar (Táctil)</p>
                    <p><strong className="text-white">Pellizcar:</strong> Acercar/Alejar</p>
                    <p><strong className="text-white">H:</strong> Mostrar/Ocular UI</p>
                </div>
            </div>
        </aside>
    );
};

export default ControlsUI;