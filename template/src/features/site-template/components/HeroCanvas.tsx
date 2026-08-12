import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';

function HeroOrb() {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useFrame((_, delta) => {
    if (reduceMotion || !meshRef.current || !groupRef.current) {
      return;
    }

    meshRef.current.rotation.x += delta * 0.25;
    meshRef.current.rotation.y += delta * 0.35;
    groupRef.current.rotation.y += delta * 0.08;
  });

  const materialProps = useMemo(
    () => ({
      color: '#1f6f8b',
      metalness: 0.55,
      roughness: 0.22,
    }),
    [],
  );

  return (
    <Float speed={reduceMotion ? 0 : 1.4} rotationIntensity={reduceMotion ? 0 : 0.4} floatIntensity={reduceMotion ? 0 : 0.8}>
      <group ref={groupRef}>
        <mesh ref={meshRef} castShadow>
          <icosahedronGeometry args={[1.35, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.85, 0.035, 16, 96]} />
          <meshStandardMaterial color="#d8c3a5" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
    </Float>
  );
}

export function HeroCanvas() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.4, 5.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#07131a']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 2]} intensity={1.4} castShadow />
        <HeroOrb />
        <ContactShadows position={[0, -1.85, 0]} opacity={0.45} scale={12} blur={2.4} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
