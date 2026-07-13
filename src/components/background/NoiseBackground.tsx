"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useScroll, useVelocity, useSpring, MotionValue, useMotionValueEvent } from "framer-motion";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0); // Full screen quad
}
`;

const fragmentShader = `
uniform float uTime;
varying vec2 vUv;

// Simple 2D noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / 1000.0; // Scaled coordinates
  
  // Slow organic movement
  float noise = snoise(uv * 1.5 + uTime * 0.05);
  float noise2 = snoise(uv * 2.0 - uTime * 0.08);
  
  float combinedNoise = (noise + noise2) * 0.5;
  
  // Base colors (Midnight Professional)
  vec3 colorBase = vec3(0.039, 0.039, 0.039); // #0A0A0A
  vec3 colorElevated = vec3(0.071, 0.071, 0.071); // #121212
  vec3 colorAccent = vec3(0.02, 0.02, 0.063); // #050510 (Navy)
  vec3 colorGold = vec3(0.8, 0.6, 0.0); // Subdued gold
  vec3 colorCyan = vec3(0.0, 0.5, 0.6); // Subdued cyan
  
  // Mixing
  vec3 color = mix(colorBase, colorElevated, combinedNoise + 0.5);
  color = mix(color, colorAccent, sin(combinedNoise * 3.14));
  
  // Make the accents much stronger and appear more often
  if (combinedNoise > 0.1) {
      color = mix(color, colorGold, (combinedNoise - 0.1) * 0.8);
  } else if (combinedNoise < -0.1) {
      color = mix(color, colorCyan, (abs(combinedNoise) - 0.1) * 0.8);
  }

  // Increase opacity to 100% since the colors are already dark and we want to see them
  gl_FragColor = vec4(color, 1.0);
}
`;

const NoisePlane = ({ velocity }: { velocity: MotionValue<number> }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const accumulatedTime = useRef(0);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Calculate a speed multiplier based on scroll velocity. 
      // Base speed is 1.0. When scrolling fast, it can multiply by up to 50 or more.
      const currentVelocity = Math.abs(velocity.get());
      const speedMultiplier = 1.0 + (currentVelocity * 0.05);
      
      // Accumulate time manually instead of relying on state.clock.elapsedTime
      // This prevents the shader from jumping backwards when velocity drops
      accumulatedTime.current += delta * speedMultiplier;
      
      materialRef.current.uniforms.uTime.value = accumulatedTime.current;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default function NoiseBackground() {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  // Force framer-motion to track this value even though it's not attached to a motion.div
  useMotionValueEvent(smoothVelocity, "change", () => {});

  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-full h-full bg-[#0A0A0A]">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 2]} // Cap pixel ratio for performance
        gl={{ alpha: true, antialias: false }}
      >
        <NoisePlane velocity={smoothVelocity} />
      </Canvas>
    </div>
  );
}
