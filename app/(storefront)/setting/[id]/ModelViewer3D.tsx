/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { ErrorBoundary } from "react-error-boundary";

function fitToScene(object: THREE.Object3D, targetSize = 2.5) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return;
    object.scale.setScalar(targetSize / maxDim);
    box.setFromObject(object);
    box.getCenter(center);
    object.position.sub(center);
}

const ringMat = new THREE.MeshStandardMaterial({
    color: "#E5E4E2", metalness: 1, roughness: 0.1, envMapIntensity: 2,
    side: THREE.DoubleSide,
});

function GLTFPreview({ url }: { url: string }) {
    const { scene } = useGLTF(url) as any;
    const cloned = useMemo(() => scene.clone(true), [scene]);
    useEffect(() => { fitToScene(cloned); }, [cloned]);
    useEffect(() => {
        cloned.traverse((child: any) => {
            if (!child.isMesh) return;
            if (!child.geometry?.attributes?.normal) child.geometry.computeVertexNormals();
            child.castShadow = true;
            child.material = ringMat;
        });
    }, [cloned]);
    return <primitive object={cloned} />;
}

function OBJPreview({ url }: { url: string }) {
    const raw = useLoader(OBJLoader, url);
    const cloned = useMemo(() => raw.clone(true), [raw]);
    useEffect(() => { fitToScene(cloned); }, [cloned]);
    useEffect(() => {
        cloned.traverse((child: any) => {
            if (!child.isMesh) return;
            if (!child.geometry?.attributes?.normal) child.geometry.computeVertexNormals();
            child.castShadow = true;
            child.material = ringMat;
        });
    }, [cloned]);
    return <primitive object={cloned} />;
}

function SceneContent({ url }: { url: string }) {
    const isObj = url.toLowerCase().endsWith(".obj");
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <directionalLight position={[-5, 3, -5]} intensity={0.8} />
            <Environment preset="studio" />
            <ErrorBoundary fallback={
                <Html center>
                    <p className="text-red-400 text-xs bg-black/80 px-3 py-2 rounded">Preview unavailable</p>
                </Html>
            }>
                <Suspense fallback={
                    <Html center>
                        <p className="text-white/60 text-xs uppercase tracking-widest animate-pulse">Loading model…</p>
                    </Html>
                }>
                    {isObj ? <OBJPreview url={url} /> : <GLTFPreview url={url} />}
                </Suspense>
            </ErrorBoundary>
            <OrbitControls enablePan={false} minDistance={0.5} maxDistance={15} autoRotate autoRotateSpeed={1.2} />
        </>
    );
}

export default function ModelViewer3D({ url }: { url: string }) {
    return (
        <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [3, 2, 3], fov: 45, near: 0.01, far: 1000 }}
            className="w-full h-full"
        >
            <SceneContent url={url} />
        </Canvas>
    );
}
