import React from 'react';
import { FractalType, BaseGeometry } from '../types';

interface MathHUDProps {
    isVisible: boolean;
    fractalType: FractalType;
    baseGeometry: BaseGeometry;
    depth: number;
}

const MathHUD: React.FC<MathHUDProps> = ({ isVisible, fractalType, baseGeometry, depth }) => {
    if (!isVisible) return null;

    const getGeomDisplayName = (geom: BaseGeometry): string => {
        switch(geom) {
            case 'icosahedron': return 'Icosaedro';
            case 'cube': return 'Cubo';
            case 'tetrahedron': return 'Tetraedro';
            case 'octahedron': return 'Octaedro';
            default: return 'Desconocida';
        }
    };

    const getFractalDisplayName = (type: FractalType): string => {
        switch (type) {
            case 'noegenesis': return 'Junta de Sierpinski 3D';
            case 'koch': return 'Copo de Nieve de Koch 3D';
            case 'mandelbrot': return 'Conjunto de Mandelbrot 3D';
            case 'julia': return 'Conjunto de Julia 3D';
            case 'hybrid': return 'Híbrido (Koch/Sierpinski/Julia)';
            default: return 'Desconocido';
        }
    };

    const getBaseFaceCount = (geom: BaseGeometry): number => {
        switch(geom) {
            case 'icosahedron': return 20;
            case 'cube': return 12; // 6 faces * 2 triangles/face
            case 'tetrahedron': return 4;
            case 'octahedron': return 8;
            default: return 0;
        }
    }

    const calculateFaces = (): string => {
        const baseFaces = getBaseFaceCount(baseGeometry);
        switch (fractalType) {
            case 'noegenesis':
                return (baseFaces * Math.pow(3, depth)).toLocaleString('es-ES');
            case 'koch': {
                let facesPerTriangle = 1;
                for (let i = 0; i < depth; i++) {
                    // This is a simplification; the real formula is more complex
                    // as it depends on how many new faces are added per original face.
                    // For Koch, each triangle becomes 4, but some are elevated,
                    // adding 3 new faces for each subdivision triangle.
                    // Let's use a common growth pattern for visualization.
                    facesPerTriangle = 4 * facesPerTriangle;
                }
                 // Initial triangle + 3 new per sub-triangle
                let totalFaces = baseFaces;
                 if (depth > 0) {
                    let subFaces = baseFaces * 3; // 3 triangles added for the first iteration's spike
                    for (let i = 1; i < depth; i++) {
                        subFaces *= 4; // Each of the 3 spike faces + the base get subdivided
                    }
                    totalFaces = baseFaces + subFaces; // approximation
                 }
                return (baseFaces * Math.pow(4, depth)).toLocaleString('es-ES');
            }
            case 'mandelbrot':
            case 'julia':
            case 'hybrid':
                return 'Variable';
            default:
                return 'N/A';
        }
    };

    const genericPseudocode = `function generarFractal(forma, detalle) {
  if (detalle === 0) {
    dibujar(forma);
    return;
  }

  // 1. Subdividir la forma actual
  const subFormas = subdividir(forma);

  // 2. Llamada recursiva para cada sub-forma
  for (const subForma of subFormas) {
    generarFractal(subForma, detalle - 1);
  }
}`;

    return (
        <aside className={`absolute bottom-5 left-5 p-5 bg-black/70 border border-gray-800/50 rounded-xl max-w-sm text-gray-300 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold text-orange-400 mb-2">Estado Matemático</h2>
                    <div className="text-sm space-y-1">
                        <p><strong>Geometría Base:</strong> <span className="text-white">{getGeomDisplayName(baseGeometry)}</span></p>
                        <p><strong>Algoritmo:</strong> <span className="text-white">{getFractalDisplayName(fractalType)}</span></p>
                        <p><strong>Nivel de Detalle (n):</strong> <span className="text-white">{depth}</span></p>
                        <p><strong>Caras Totales (C):</strong> <span className="text-white">{calculateFaces()}</span></p>
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-700/50">
                     <h2 className="text-lg font-bold text-orange-400 mb-2">Lógica Recursiva</h2>
                     <pre className="bg-gray-900/50 p-3 rounded-md text-xs text-gray-400 whitespace-pre-wrap"><code>{genericPseudocode}</code></pre>
                </div>
            </div>
        </aside>
    );
};

export default MathHUD;
