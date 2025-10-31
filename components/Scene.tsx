import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { RotationControls, RotationAxis, BodyVisibility, FractalType } from '../types';

interface SceneProps {
    depth: number;
    fov: number;
    speed: number;
    fractalType: FractalType;
    rotationAxis: RotationAxis;
    rotationControls: RotationControls;
    isDopplerEffect: boolean;
    isPixelView: boolean;
    bodyVisibility: BodyVisibility;
}

interface FractalArtifacts {
    structureGroup: THREE.Group;
    geoidePrincipalGroup: THREE.Group;
    geoideInteriorGroup: THREE.Group;
    geoideExteriorGroup: THREE.Group;
    mainFractalMeshes: THREE.Mesh[];
    mainLineMeshes: THREE.LineSegments[];
}

const Scene: React.FC<SceneProps> = (props) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(props);
    const fadingOutGroupRef = useRef<THREE.Group | null>(null);
    const transitionStartTimeRef = useRef<number | null>(null);
    const lastPinchDistance = useRef<number | null>(null);
    const lastTouch = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        propsRef.current = props;
    });

    useEffect(() => {
        const mountNode = mountRef.current;
        if (!mountNode) return;

        let animationFrameId: number;
        const TRANSITION_DURATION = 0.75; // seconds

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.01);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.z = 20;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000);
        mountNode.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        scene.add(ambientLight);

        const innerLight = new THREE.PointLight(0xffffff, 2.5, 300);
        innerLight.castShadow = true;
        innerLight.shadow.mapSize.width = 2048;
        innerLight.shadow.mapSize.height = 2048;
        innerLight.shadow.bias = -0.01;
        scene.add(innerLight);

        const renderTarget = new THREE.WebGLRenderTarget(256, 256);
        renderTarget.texture.magFilter = THREE.NearestFilter;
        const postFXScene = new THREE.Scene();
        const postFXCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const postFXMaterial = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
        const postFXMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postFXMaterial);
        postFXScene.add(postFXMesh);

        const traverseMaterials = (group: THREE.Group, callback: (material: THREE.Material) => void) => {
            group.traverse(obj => {
                if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(callback);
                    } else if (obj.material) {
                        callback(obj.material as THREE.Material);
                    }
                }
            });
        };

        const disposeGroup = (group: THREE.Group) => {
            group.traverse(object => {
                if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else if (object.material){
                        (object.material as THREE.Material).dispose();
                    }
                }
            });
        };

        const generateStructure = (currentDepth: number, currentFractalType: FractalType): FractalArtifacts => {
            const structureGroup = new THREE.Group();
            scene.add(structureGroup);
            const mainFractalMeshes: THREE.Mesh[] = [];
            const mainLineMeshes: THREE.LineSegments[] = [];

            const radius = 7.5;
            const baseGeometry = new THREE.IcosahedronGeometry(radius, 1);
            const positions = baseGeometry.attributes.position;

            const mainMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.1 });
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8c00 });
            const dualMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

            const geoidePrincipalGroup = new THREE.Group();
            const geoideInteriorGroup = new THREE.Group();
            const geoideExteriorGroup = new THREE.Group();
            
            if (currentFractalType === 'hybrid') {
                const kochVertices: number[][] = [];
                const sierpinskiMainVertices: number[][] = [];
                const sierpinskiDualVertices: number[][] = [];
                const juliaVertices: number[][] = [];

                for (let i = 0; i < positions.count; i += 3) {
                    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i);
                    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
                    const v3 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
                    buildKoch(v1, v2, v3, currentDepth, kochVertices);
                    buildFractal(v1, v2, v3, currentDepth, sierpinskiMainVertices, sierpinskiDualVertices);
                    buildJulia(v1, v2, v3, currentDepth, juliaVertices);
                }
                
                const kochGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(kochVertices.flat(), 3));
                kochGeom.computeVertexNormals();
                const kochMesh = new THREE.Mesh(kochGeom, mainMaterial.clone());
                kochMesh.castShadow = true; kochMesh.receiveShadow = true;
                const kochLineVertices = [];
                for (let i = 0; i < kochVertices.length; i += 3) {
                    const [v1, v2, v3] = [kochVertices[i], kochVertices[i + 1], kochVertices[i + 2]];
                    kochLineVertices.push(...v1, ...v2, ...v2, ...v3, ...v3, ...v1);
                }
                const kochLineGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(kochLineVertices, 3));
                const kochLines = new THREE.LineSegments(kochLineGeom, lineMaterial.clone());
                geoideExteriorGroup.add(kochMesh, kochLines);
                geoideExteriorGroup.scale.set(1.5, 1.5, 1.5);
                mainFractalMeshes.push(kochMesh);
                mainLineMeshes.push(kochLines);

                const sierpinskiGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sierpinskiMainVertices.flat(), 3));
                sierpinskiGeom.computeVertexNormals();
                const sierpinskiMesh = new THREE.Mesh(sierpinskiGeom, mainMaterial.clone());
                sierpinskiMesh.castShadow = true; sierpinskiMesh.receiveShadow = true;
                const sierpinskiLineVertices = [];
                for (let i = 0; i < sierpinskiMainVertices.length; i += 3) {
                    const [v1, v2, v3] = [sierpinskiMainVertices[i], sierpinskiMainVertices[i + 1], sierpinskiMainVertices[i + 2]];
                    sierpinskiLineVertices.push(...v1, ...v2, ...v2, ...v3, ...v3, ...v1);
                }
                const sierpinskiLineGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sierpinskiLineVertices, 3));
                const sierpinskiLines = new THREE.LineSegments(sierpinskiLineGeom, lineMaterial.clone());
                geoidePrincipalGroup.add(sierpinskiMesh, sierpinskiLines);
                mainFractalMeshes.push(sierpinskiMesh);
                mainLineMeshes.push(sierpinskiLines);

                const juliaGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(juliaVertices.flat(), 3));
                juliaGeom.computeVertexNormals();
                const juliaMaterial = new THREE.MeshStandardMaterial({ color: 0x9400D3, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 });
                const juliaMesh = new THREE.Mesh(juliaGeom, juliaMaterial);
                juliaMesh.castShadow = true; juliaMesh.receiveShadow = true;
                 const juliaLineVertices = [];
                 for (let i = 0; i < juliaVertices.length; i += 3) {
                    const [v1, v2, v3] = [juliaVertices[i], juliaVertices[i + 1], juliaVertices[i + 2]];
                    juliaLineVertices.push(...v1, ...v2, ...v2, ...v3, ...v3, ...v1);
                }
                const juliaLineGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(juliaLineVertices, 3));
                const juliaLines = new THREE.LineSegments(juliaLineGeom, new THREE.LineBasicMaterial({ color: 0xDA70D6 }));
                geoideInteriorGroup.add(juliaMesh, juliaLines);
                geoideInteriorGroup.scale.set(0.5, 0.5, 0.5);
                mainFractalMeshes.push(juliaMesh);
                mainLineMeshes.push(juliaLines);

            } else {
                const mainVertices: number[][] = [];
                const dualVertices: number[][] = [];

                for (let i = 0; i < positions.count; i += 3) {
                    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i);
                    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
                    const v3 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
                    if(currentFractalType === 'noegenesis') {
                        buildFractal(v1, v2, v3, currentDepth, mainVertices, dualVertices);
                    } else if (currentFractalType === 'koch') {
                        buildKoch(v1,v2,v3, currentDepth, mainVertices);
                    } else if (currentFractalType === 'mandelbrot') {
                        buildMandelbrot(v1, v2, v3, currentDepth, mainVertices);
                    } else if (currentFractalType === 'julia') {
                        buildJulia(v1, v2, v3, currentDepth, mainVertices);
                    }
                }

                const mainGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(mainVertices.flat(), 3));
                mainGeom.computeVertexNormals();
                const dualGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(dualVertices.flat(), 3));
                dualGeom.computeVertexNormals();
                
                const lineVertices = [];
                for (let i = 0; i < mainVertices.length; i += 3) {
                    const [v1, v2, v3] = [mainVertices[i], mainVertices[i + 1], mainVertices[i + 2]];
                    lineVertices.push(...v1, ...v2, ...v2, ...v3, ...v3, ...v1);
                }
                const lineGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

                const mainFractalMesh1 = new THREE.Mesh(mainGeom, mainMaterial.clone());
                mainFractalMesh1.castShadow = true; mainFractalMesh1.receiveShadow = true;
                const mainFractalLines1 = new THREE.LineSegments(lineGeom, lineMaterial.clone());
                geoidePrincipalGroup.add(mainFractalMesh1, mainFractalLines1);
                mainFractalMeshes.push(mainFractalMesh1);
                mainLineMeshes.push(mainFractalLines1);

                const dualFractalMesh2 = new THREE.Mesh(dualGeom, dualMaterial.clone());
                dualFractalMesh2.castShadow = false; dualFractalMesh2.receiveShadow = true;
                geoideInteriorGroup.add(dualFractalMesh2);
                geoideInteriorGroup.scale.set(0.5, 0.5, 0.5);

                const mainFractalMesh3 = new THREE.Mesh(mainGeom, mainMaterial.clone());
                mainFractalMesh3.castShadow = true; mainFractalMesh3.receiveShadow = true;
                const mainFractalLines3 = new THREE.LineSegments(lineGeom, lineMaterial.clone());
                const dualFractalMesh3 = new THREE.Mesh(dualGeom, dualMaterial.clone());
                dualFractalMesh3.castShadow = false; dualFractalMesh3.receiveShadow = true;
                geoideExteriorGroup.add(mainFractalMesh3, mainFractalLines3, dualFractalMesh3);
                geoideExteriorGroup.scale.set(1.5, 1.5, 1.5);
                mainFractalMeshes.push(mainFractalMesh3);
                mainLineMeshes.push(mainFractalLines3);
            }

            structureGroup.add(geoidePrincipalGroup, geoideInteriorGroup, geoideExteriorGroup);
            return { structureGroup, geoidePrincipalGroup, geoideInteriorGroup, geoideExteriorGroup, mainFractalMeshes, mainLineMeshes };
        };

        const buildFractal = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, depth: number, mainList: number[][], dualList: number[][]) => {
            if (depth === 0) {
                mainList.push(v1.toArray(), v2.toArray(), v3.toArray());
                return;
            }
            const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
            const m31 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);
            buildFractal(v1, m12, m31, depth - 1, mainList, dualList);
            buildFractal(m12, v2, m23, depth - 1, mainList, dualList);
            buildFractal(m31, m23, v3, depth - 1, mainList, dualList);
            buildHole(m12, m23, m31, depth - 1, dualList);
        };
        
        const buildKoch = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, depth: number, vertexList: number[][]) => {
            if (depth === 0) {
                vertexList.push(v1.toArray(), v2.toArray(), v3.toArray());
                return;
            }

            const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
            const m31 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);

            buildKoch(v1, m12, m31, depth - 1, vertexList);
            buildKoch(m12, v2, m23, depth - 1, vertexList);
            buildKoch(m31, m23, v3, depth - 1, vertexList);

            const centroid = new THREE.Vector3().add(m12).add(m23).add(m31).divideScalar(3);
            const normal = new THREE.Vector3().crossVectors(
                new THREE.Vector3().subVectors(m23, m12),
                new THREE.Vector3().subVectors(m31, m12)
            ).normalize();

            const edgeLength = m12.distanceTo(m23);
            const spikeHeight = edgeLength * Math.sqrt(2.0 / 3.0);
            const spikeApex = new THREE.Vector3().addVectors(centroid, normal.multiplyScalar(spikeHeight));
            
            vertexList.push(m12.toArray(), m23.toArray(), spikeApex.toArray());
            vertexList.push(m23.toArray(), m31.toArray(), spikeApex.toArray());
            vertexList.push(m31.toArray(), m12.toArray(), spikeApex.toArray());
        };

        const juliaIteration = (zx: number, zy: number, maxIter: number): number => {
            const cx = -0.70176;
            const cy = -0.3842;
            let i = 0;
            while (zx * zx + zy * zy <= 4 && i < maxIter) {
                const tmp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = tmp;
                i++;
            }
            return i;
        };

        const buildJulia = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, depth: number, vertexList: number[][]) => {
            if (depth === 0) {
                vertexList.push(v1.toArray(), v2.toArray(), v3.toArray());
                return;
            }
        
            const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
            const m31 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);
        
            buildJulia(v1, m12, m31, depth - 1, vertexList);
            buildJulia(m12, v2, m23, depth - 1, vertexList);
            buildJulia(m31, m23, v3, depth - 1, vertexList);
        
            const centroid = new THREE.Vector3().add(m12).add(m23).add(m31).divideScalar(3);
            
            const zx = (centroid.x / 7.5) * 2.0;
            const zy = (centroid.y / 7.5) * 2.0;
            
            const maxIterations = 32;
            const iterations = juliaIteration(zx, zy, maxIterations);
        
            if (iterations < maxIterations) {
                const normal = new THREE.Vector3().crossVectors(
                    new THREE.Vector3().subVectors(m23, m12),
                    new THREE.Vector3().subVectors(m31, m12)
                ).normalize();
                
                const maxHeight = 1.5;
                const height = (1.0 - (iterations / maxIterations)) * maxHeight * (v1.length() / 7.5);
        
                const spikeApex = new THREE.Vector3().addVectors(centroid, normal.multiplyScalar(height));
        
                vertexList.push(m12.toArray(), m23.toArray(), spikeApex.toArray());
                vertexList.push(m23.toArray(), m31.toArray(), spikeApex.toArray());
                vertexList.push(m31.toArray(), m12.toArray(), spikeApex.toArray());
            } else {
                vertexList.push(m12.toArray(), m23.toArray(), m31.toArray());
            }
        };

        const mandelbrotIteration = (cx: number, cy: number, maxIter: number): number => {
            let zx = 0;
            let zy = 0;
            let i = 0;
            while (zx * zx + zy * zy <= 4 && i < maxIter) {
                const tmp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = tmp;
                i++;
            }
            return i;
        };

        const buildMandelbrot = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, depth: number, vertexList: number[][]) => {
            if (depth === 0) {
                vertexList.push(v1.toArray(), v2.toArray(), v3.toArray());
                return;
            }
        
            const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
            const m31 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);
        
            buildMandelbrot(v1, m12, m31, depth - 1, vertexList);
            buildMandelbrot(m12, v2, m23, depth - 1, vertexList);
            buildMandelbrot(m31, m23, v3, depth - 1, vertexList);
        
            const centroid = new THREE.Vector3().add(m12).add(m23).add(m31).divideScalar(3);
            
            const cx = (centroid.x / 7.5) * 1.5 - 0.5;
            const cy = (centroid.y / 7.5) * 1.5;
            
            const maxIterations = 32;
            const iterations = mandelbrotIteration(cx, cy, maxIterations);
        
            if (iterations < maxIterations) {
                const normal = new THREE.Vector3().crossVectors(
                    new THREE.Vector3().subVectors(m23, m12),
                    new THREE.Vector3().subVectors(m31, m12)
                ).normalize();
                
                const maxHeight = 1.5;
                const height = (1.0 - (iterations / maxIterations)) * maxHeight * (v1.length() / 7.5);
        
                const spikeApex = new THREE.Vector3().addVectors(centroid, normal.multiplyScalar(height));
        
                vertexList.push(m12.toArray(), m23.toArray(), spikeApex.toArray());
                vertexList.push(m23.toArray(), m31.toArray(), spikeApex.toArray());
                vertexList.push(m31.toArray(), m12.toArray(), spikeApex.toArray());
            } else {
                vertexList.push(m12.toArray(), m23.toArray(), m31.toArray());
            }
        };

        const buildHole = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, depth: number, holeList: number[][]) => {
            if (depth === 0) {
                holeList.push(v1.toArray(), v2.toArray(), v3.toArray());
                return;
            }
            const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
            const m31 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);
            buildHole(v1, m12, m31, depth - 1, holeList);
            buildHole(m12, v2, m23, depth - 1, holeList);
            buildHole(m31, m23, v3, depth - 1, holeList);
        };
        
        let activeArtifacts = generateStructure(propsRef.current.depth, propsRef.current.fractalType);
        let currentDepth = propsRef.current.depth;
        let currentFractalType = propsRef.current.fractalType;

        const keyState: { [code: string]: boolean } = {};
        const onKeyDown = (e: KeyboardEvent) => { keyState[e.code] = true; };
        const onKeyUp = (e: KeyboardEvent) => { keyState[e.code] = false; };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        const onMouseMove = (event: MouseEvent) => {
            if (document.pointerLockElement === renderer.domElement) {
                euler.setFromQuaternion(camera.quaternion);
                euler.y -= event.movementX * 0.0007;
                euler.x -= event.movementY * 0.0007;
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                camera.quaternion.setFromEuler(euler);
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        
        const onCanvasClick = () => renderer.domElement.requestPointerLock();
        renderer.domElement.addEventListener('click', onCanvasClick);
        
        const getDistance = (touches: TouchList): number => {
            const touch1 = touches[0];
            const touch2 = touches[1];
            return Math.sqrt(
                Math.pow(touch2.pageX - touch1.pageX, 2) +
                Math.pow(touch2.pageY - touch1.pageY, 2)
            );
        };

        const onTouchStart = (event: TouchEvent) => {
            if (event.touches.length === 1) {
                event.preventDefault();
                lastTouch.current = { x: event.touches[0].pageX, y: event.touches[0].pageY };
            } else if (event.touches.length === 2) {
                event.preventDefault();
                lastPinchDistance.current = getDistance(event.touches);
                lastTouch.current = null; // Disable rotation when pinching
            }
        };

        const onTouchMove = (event: TouchEvent) => {
            if (event.touches.length === 1 && lastTouch.current) {
                event.preventDefault();
                const touch = event.touches[0];
                const deltaX = touch.pageX - lastTouch.current.x;
                const deltaY = touch.pageY - lastTouch.current.y;

                euler.setFromQuaternion(camera.quaternion);
                euler.y -= deltaX * 0.002;
                euler.x -= deltaY * 0.002;
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                camera.quaternion.setFromEuler(euler);

                lastTouch.current = { x: touch.pageX, y: touch.pageY };
            } else if (event.touches.length === 2 && lastPinchDistance.current !== null) {
                event.preventDefault();
                const newDistance = getDistance(event.touches);
                const deltaDistance = newDistance - lastPinchDistance.current;
                const moveSensitivity = 0.15;
                camera.translateZ(-deltaDistance * moveSensitivity);
                lastPinchDistance.current = newDistance;
            }
        };

        const onTouchEnd = (event: TouchEvent) => {
            if (event.touches.length < 2) {
                lastPinchDistance.current = null;
            }
            if (event.touches.length < 1) {
                lastTouch.current = null;
            }
        };

        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd);
        
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const state = propsRef.current;
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            // Handle transition animation
            if (fadingOutGroupRef.current && transitionStartTimeRef.current !== null) {
                const progress = Math.min((time - transitionStartTimeRef.current) / TRANSITION_DURATION, 1.0);

                traverseMaterials(fadingOutGroupRef.current, mat => { mat.opacity = 1.0 - progress; });
                traverseMaterials(activeArtifacts.structureGroup, mat => { mat.opacity = progress; });

                if (progress >= 1.0) {
                    scene.remove(fadingOutGroupRef.current);
                    disposeGroup(fadingOutGroupRef.current);
                    fadingOutGroupRef.current = null;
                    transitionStartTimeRef.current = null;

                    traverseMaterials(activeArtifacts.structureGroup, mat => {
                        mat.transparent = false;
                        mat.opacity = 1.0;
                    });
                }
            }

            // Handle prop changes imperatively
            if (currentDepth !== state.depth || currentFractalType !== state.fractalType) {
                if (fadingOutGroupRef.current) {
                    scene.remove(fadingOutGroupRef.current);
                    disposeGroup(fadingOutGroupRef.current);
                }

                fadingOutGroupRef.current = activeArtifacts.structureGroup;
                transitionStartTimeRef.current = time;
                traverseMaterials(fadingOutGroupRef.current, mat => { mat.transparent = true; });

                currentDepth = state.depth;
                currentFractalType = state.fractalType;
                const newArtifacts = generateStructure(currentDepth, currentFractalType);
                traverseMaterials(newArtifacts.structureGroup, mat => {
                    mat.transparent = true;
                    mat.opacity = 0;
                });
                activeArtifacts = newArtifacts;
            }
            if (camera.fov !== state.fov) {
                camera.fov = state.fov;
                camera.updateProjectionMatrix();
            }
            activeArtifacts.geoidePrincipalGroup.visible = state.bodyVisibility.principal;
            activeArtifacts.geoideInteriorGroup.visible = state.bodyVisibility.interior;
            activeArtifacts.geoideExteriorGroup.visible = state.bodyVisibility.exterior;

            activeArtifacts.mainFractalMeshes.forEach(m => m.visible = state.isDopplerEffect);
            activeArtifacts.mainLineMeshes.forEach(m => m.visible = !state.isDopplerEffect);

            const moveSpeed = 6.0 * delta;
            const rollSpeed = 0.7 * delta;
            if (keyState['KeyW']) camera.translateZ(-moveSpeed);
            if (keyState['KeyS']) camera.translateZ(moveSpeed);
            if (keyState['KeyA']) camera.translateX(-moveSpeed);
            if (keyState['KeyD']) camera.translateX(moveSpeed);
            if (keyState['KeyQ']) camera.rotateZ(rollSpeed);
            if (keyState['KeyE']) camera.rotateZ(-rollSpeed);

            innerLight.position.x = Math.sin(time * 0.35) * 12.0;
            innerLight.position.y = Math.cos(time * 0.25) * 12.0;
            innerLight.position.z = Math.sin(time * 0.15) * 12.0;

            const speed = state.speed / 20000;
            if (speed > 0) {
                const applyRotation = (group: THREE.Group, speedMultiplier = 1) => {
                    const effectiveSpeed = speed * speedMultiplier;
                    if (state.rotationAxis === 'horizontal') group.rotation.y += effectiveSpeed;
                    else if (state.rotationAxis === 'vertical') group.rotation.x += effectiveSpeed;
                    else {
                        group.rotation.y += effectiveSpeed;
                        group.rotation.x += effectiveSpeed * 0.7;
                    }
                };
                if (state.rotationControls.principal) applyRotation(activeArtifacts.geoidePrincipalGroup);
                if (state.rotationControls.interior) applyRotation(activeArtifacts.geoideInteriorGroup, -0.5);
                if (state.rotationControls.exterior) applyRotation(activeArtifacts.geoideExteriorGroup, 0.2);
            }

            if (state.isDopplerEffect) {
                updateDopplerColors(speed, state.rotationAxis, activeArtifacts.structureGroup, activeArtifacts.mainFractalMeshes);
            }

            if (state.isPixelView) {
                renderer.setRenderTarget(renderTarget);
                renderer.render(scene, camera);
                renderer.setRenderTarget(null);
                renderer.render(postFXScene, postFXCamera);
            } else {
                renderer.setRenderTarget(null);
                renderer.render(scene, camera);
            }
        };
        
        const baseMainColor = new THREE.Color(0xff8c00);
        const blueshiftColor = new THREE.Color(0xffff00);
        const redshiftColor = new THREE.Color(0x000000);
        const tempVec = new THREE.Vector3();
        const tempColor = new THREE.Color();
        
        function updateDopplerColors(speed: number, axis: RotationAxis, structureGroup: THREE.Group, mainFractalMeshes: THREE.Mesh[]) {
            const angularVelocity = new THREE.Vector3();
            if (axis === 'horizontal') angularVelocity.y = speed * 100;
            else if (axis === 'vertical') angularVelocity.x = speed * 100;
            else { angularVelocity.y = speed * 100; angularVelocity.x = speed * 70; }
            
            structureGroup.updateMatrixWorld(true);
            mainFractalMeshes.forEach(mesh => {
                 if (!mesh.geometry.attributes.color) {
                    const positions = mesh.geometry.attributes.position;
                    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));
                }
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.vertexColors = true;
                material.needsUpdate = true;
    
                 const positions = mesh.geometry.attributes.position;
                 const colors = mesh.geometry.attributes.color;
                 const worldMatrix = mesh.matrixWorld;
    
                 for (let i = 0; i < positions.count; i++) {
                    tempVec.fromBufferAttribute(positions, i).applyMatrix4(worldMatrix);
                    const linearVelocity = tempVec.clone().cross(angularVelocity).negate();
                    const viewVector = camera.position.clone().sub(tempVec).normalize();
                    const relativeSpeed = linearVelocity.dot(viewVector); 
            
                    tempColor.copy(baseMainColor);
                    if (relativeSpeed > 0) tempColor.lerp(blueshiftColor, Math.min(relativeSpeed * 0.17, 1.0));
                    else tempColor.lerp(redshiftColor, Math.min(-relativeSpeed * 0.17, 1.0));
    
                    colors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
                }
                colors.needsUpdate = true;
            });
        }


        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderTarget.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            document.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', onCanvasClick);
            renderer.domElement.removeEventListener('touchstart', onTouchStart);
            renderer.domElement.removeEventListener('touchmove', onTouchMove);
            renderer.domElement.removeEventListener('touchend', onTouchEnd);
            mountNode.removeChild(renderer.domElement);
            renderer.dispose();
            disposeGroup(activeArtifacts.structureGroup);
            if (fadingOutGroupRef.current) {
                disposeGroup(fadingOutGroupRef.current);
            }
        };
    }, []);

    return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default Scene;