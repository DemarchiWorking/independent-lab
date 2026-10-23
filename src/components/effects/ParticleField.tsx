"use client";

// Fundo sutil em WebGL (three.js via @react-three/fiber + drei) para o hero
// da landing (GH-MKT-01) — decorativo, nunca bloqueia interação
// (pointer-events-none no wrapper) e nunca renderiza sob
// prefers-reduced-motion (checado em `MotionCanvas`, o componente pai, antes
// de montar isto via `dynamic(..., { ssr: false })`).
import { Canvas } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";

export function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      className="!absolute inset-0"
    >
      <Sparkles
        count={120}
        scale={[9, 5.5, 3]}
        size={2.2}
        speed={0.22}
        opacity={0.5}
        noise={0.45}
        color="#00D4C8"
      />
      <Sparkles
        count={50}
        scale={[7, 4, 3]}
        size={1.6}
        speed={0.14}
        opacity={0.35}
        noise={0.3}
        color="#F59E0B"
      />
    </Canvas>
  );
}
