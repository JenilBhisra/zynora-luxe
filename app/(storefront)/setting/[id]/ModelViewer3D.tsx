/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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

// Clean model URL to strip f_auto,q_auto if present in raw path
function cleanModelUrl(rawUrl: string): string {
    if (!rawUrl) return "";
    let u = rawUrl;
    if (u.includes("/raw/upload/f_auto,q_auto/")) {
        u = u.replace("/raw/upload/f_auto,q_auto/", "/raw/upload/");
    }
    if (u.includes("/raw/upload/") && (u.includes("f_auto") || u.includes("q_auto"))) {
        u = u.replace(/\/raw\/upload\/[^/]+\//, "/raw/upload/");
    }
    return u;
}

function AutoModelPreview({ url, shape }: { url: string | null | undefined; shape?: string }) {
    const getDiamondModelFallback = (sName: string): string => {
        const s = (sName || "").trim().toLowerCase();
        if (s === "princess" || s === "radiant") {
            return "/models/diamonds/princess.glb";
        }
        if (s === "oval" || s === "pear") {
            return "/models/diamonds/oval.glb";
        }
        return "/models/diamonds/round.glb";
    };

    const resolvedUrl = url || (shape ? getDiamondModelFallback(shape) : "");
    const cleanedUrl = cleanModelUrl(resolvedUrl);
    const cleanPath = cleanedUrl.split('?')[0].split('#')[0].toLowerCase();
    
    // Guess format synchronously if possible
    const getSynchronousFormat = (): "obj" | "gltf" | null => {
        if (!cleanedUrl) return null;
        if (cleanPath.endsWith(".obj")) return "obj";
        if (cleanPath.endsWith(".gltf") || cleanPath.endsWith(".glb")) return "gltf";
        return null; // Ambiguous, needs async check
    };

    const [format, setFormat] = useState<"obj" | "gltf" | null>(getSynchronousFormat());
    const [isDetecting, setIsDetecting] = useState(!!cleanedUrl && getSynchronousFormat() === null);
    const [isError, setIsError] = useState(!cleanedUrl);
    const [hasFlipped, setHasFlipped] = useState(false);

    useEffect(() => {
        if (!cleanedUrl) {
            setIsError(true);
            return;
        }

        let active = true;
        const syncFormat = getSynchronousFormat();
        if (syncFormat !== null) {
            setFormat(syncFormat);
            setIsDetecting(false);
            
            // Check if file actually exists (GET / HEAD request)
            const verifyFileExists = async () => {
                try {
                    const response = await fetch(cleanedUrl, { method: "HEAD" });
                    if (!active) return;
                    if (!response.ok) {
                        const getResponse = await fetch(cleanedUrl);
                        if (!active) return;
                        if (!getResponse.ok) {
                            setIsError(true);
                        }
                    }
                } catch (err) {
                    console.warn("[ModelViewer3D] File verification failed:", err);
                    if (active) {
                        setIsError(true);
                    }
                }
            };
            verifyFileExists();
            return;
        }

        setIsDetecting(true);
        const detect = async () => {
            try {
                const response = await fetch(cleanedUrl);
                if (!active) return;
                if (!response.ok) {
                    setIsError(true);
                    setIsDetecting(false);
                    return;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    const text = await response.text();
                    if (!active) return;
                    const trimmed = text.trim();
                    if (trimmed.startsWith("{") || trimmed.startsWith("glTF")) {
                        setFormat("gltf");
                    } else {
                        setFormat("obj");
                    }
                    setIsDetecting(false);
                    return;
                }

                const { value } = await reader.read();
                reader.cancel();

                if (!active) return;
                if (!value) {
                    setIsError(true);
                    setIsDetecting(false);
                    return;
                }

                const decoder = new TextDecoder("utf-8");
                const chunk = decoder.decode(value);
                const trimmed = chunk.trim();

                if (chunk.startsWith("glTF") || trimmed.startsWith("{")) {
                    setFormat("gltf");
                } else {
                    setFormat("obj");
                }
            } catch (err) {
                console.error("[ModelViewer3D] Async format check failed, defaulting to gltf:", err);
                if (active) {
                    setIsError(true);
                }
            } finally {
                if (active) {
                    setIsDetecting(false);
                }
            }
        };

        detect();

        return () => {
            active = false;
        };
    }, [cleanedUrl]);

    const handleError = (error: any) => {
        console.warn(`[ModelViewer3D] Failed to load 3D model as ${format}, attempting fallback...`, error);
        if (!hasFlipped && format) {
            setFormat(format === "obj" ? "gltf" : "obj");
            setHasFlipped(true);
        } else {
            setIsError(true);
        }
    };

    if (isError) {
        return (
            <Html center>
                <div className="bg-black/90 border border-zinc-800 text-zinc-400 text-xs px-4 py-3 rounded-lg shadow-xl text-center min-w-[200px] select-none">
                    <p className="font-semibold text-zinc-200 mb-1">3D Preview Unavailable</p>
                    <p className="text-[10px] text-zinc-500">Could not load model file</p>
                </div>
            </Html>
        );
    }

    if (isDetecting || !format) {
        return (
            <Html center>
                <p className="text-white/60 text-xs uppercase tracking-widest animate-pulse">Loading model…</p>
            </Html>
        );
    }

    return (
        <ErrorBoundary 
            key={format}
            onError={handleError}
            fallback={
                <Html center>
                    <div className="bg-black/90 border border-zinc-800 text-zinc-400 text-xs px-4 py-3 rounded-lg shadow-xl text-center min-w-[200px] select-none">
                        <p className="font-semibold text-zinc-200 mb-1">3D Preview Unavailable</p>
                        <p className="text-[10px] text-zinc-500">Could not load model file</p>
                    </div>
                </Html>
            }
        >
            <Suspense fallback={
                <Html center>
                    <p className="text-white/60 text-xs uppercase tracking-widest animate-pulse">Loading model…</p>
                </Html>
            }>
                {format === "obj" ? <OBJPreview url={cleanedUrl} /> : <GLTFPreview url={cleanedUrl} />}
            </Suspense>
        </ErrorBoundary>
    );
}

function SceneContent({ url, shape }: { url: string | null | undefined; shape?: string }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <directionalLight position={[-5, 3, -5]} intensity={0.8} />
            <Environment preset="studio" />
            <AutoModelPreview key={url || shape || ""} url={url} shape={shape} />
            <OrbitControls enablePan={false} minDistance={0.5} maxDistance={15} autoRotate autoRotateSpeed={1.2} />
        </>
    );
}

export default function ModelViewer3D({ url, shape }: { url: string | null | undefined; shape?: string }) {
    return (
        <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [3, 2, 3], fov: 45, near: 0.01, far: 1000 }}
            className="w-full h-full"
        >
            <SceneContent url={url} shape={shape} />
        </Canvas>
    );
}
