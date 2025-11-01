
export interface RotationControls {
  principal: boolean;
  interior: boolean;
  exterior: boolean;
}

export type RotationAxis = 'both' | 'horizontal' | 'vertical';

export interface BodyVisibility {
    principal: boolean;
    interior: boolean;
    exterior: boolean;
}

export type FractalType = 'noegenesis' | 'koch' | 'mandelbrot' | 'julia' | 'hybrid';

export type BaseGeometry = 'icosahedron' | 'cube' | 'tetrahedron' | 'octahedron';
