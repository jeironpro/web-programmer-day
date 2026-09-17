// ByteScene: escena 3D del día 256 (three.js vía @react-three/fiber).
// - 8 cubos "bit": los encendidos (1) emiten fósforo y flotan; los apagados
//   quedan en outlined tenue.
// - Campo de partículas binarias: billboards 0/1 generados con drei.
// - Parallax de cámara con el ratón (lerp suave) + rotación orbital lenta.
// - El render se pausa cuando la pestaña no es visible; con reduced-motion
//   se dibuja un fotograma estático.
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group, Mesh, PerspectiveCamera } from "three";
import { AdditiveBlending } from "three";

/** Color del fósforo en sRGB (coincide con --color-accent). */
const PHOSPHOR = "#55ff88";
const PHOSPHOR_DIM = "#1c5f38";

/** Ancho total de la fila de cubos (8 cubos de 0.82 + separaciones). */
const ROW_WIDTH = 7.4;
/** Margen horizontal de encuadre alrededor de la fila. */
const FRAME_MARGIN = 0.9;
/** Altura mundial del byte: lo coloca en el tercio superior, sobre el titular. */
const BYTE_Y = 2.1;
/** Distancia mínima de cámara (composición en pantallas anchas). */
const MIN_CAMERA_Z = 9;

/** Un cubo bit: emite cuando está encendido. */
function BitCube({ position, on, index }: { position: [number, number, number]; on: boolean; index: number }) {
  const meshRef = useRef<Mesh>(null);
  const phase = index * 0.9;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    // Los bits encendidos flotan suavemente (los apagados casi no se mueven).
    const amp = on ? 0.12 : 0.02;
    mesh.position.y = position[1] + Math.sin(t * 1.2 + phase) * amp;
    if (on) mesh.rotation.y = t * 0.4 + phase;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.82, 0.82, 0.82]} />
      <meshStandardMaterial
        color={on ? PHOSPHOR : PHOSPHOR_DIM}
        emissive={on ? PHOSPHOR : "#0a2417"}
        emissiveIntensity={on ? 1.4 : 0.25}
        transparent
        opacity={on ? 1 : 0.5}
        wireframe={!on}
      />
    </mesh>
  );
}

/** Campo de dígitos binarios flotando en profundidad. */
function BinaryField({ count = 44 }: { count?: number }) {
  const groupRef = useRef<Group>(null);

  // Posiciones deterministas (mismas en cada render para evitar parpadeos).
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        digit: i % 2 === 0 ? "0" : "1",
        pos: [
          ((i * 61.8) % 40) - 20,
          ((i * 37.7) % 24) - 12,
          -4 - ((i * 13.3) % 16),
        ] as [number, number, number],
        size: 0.32 + ((i * 7) % 5) * 0.07,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.getElapsedTime();
    // Deriva ascendente lenta: la "lluvia" binaria asciende como motas.
    group.children.forEach((child, i) => {
      child.position.y = particles[i].pos[1] + ((t * (0.25 + (i % 5) * 0.05)) % 24) - 12;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <Text
          key={i}
          position={p.pos}
          fontSize={p.size}
          color={i % 4 === 0 ? PHOSPHOR : PHOSPHOR_DIM}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0}
        >
          {p.digit}
        </Text>
      ))}
    </group>
  );
}

/** La fila de 8 bits, elevada sobre el titular y con balanceo orbital. */
function ByteRow() {
  const groupRef = useRef<Group>(null);
  // Los ocho bits encendidos: el byte del día al completo.
  const pattern = [1, 1, 1, 1, 1, 1, 1, 1];

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    // Órbita de balanceo del byte completo.
    group.rotation.y = Math.sin(clock.getElapsedTime() * 0.25) * 0.22;
  });

  return (
    <group ref={groupRef} position={[0, BYTE_Y, 0]}>
      {pattern.map((on, i) => (
        <BitCube
          key={i}
          index={i}
          on={on === 1}
          position={[(i - 3.5) * 1.05, 0, 0]}
        />
      ))}
      {/* Núcleo glow central: el "carry" que hace 255 -> 256 */}
      <mesh position={[0, 0, -1.6]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color={PHOSPHOR} transparent opacity={0.32} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

/**
 * Encuadre reactivo: ajusta la distancia de la cámara para que la fila de
 * cubos quepa completa en el ancho visible, sea cual sea el aspecto del
 * viewport (en vertical la cámara se aleja; en horizontal mantiene el mínimo).
 */
function CameraFitter() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    const aspect = size.width / size.height;
    const halfFov = (camera.fov * Math.PI) / 180 / 2;
    // Semiancho visible a distancia z: z * tan(fov/2) * aspect.
    // Despejamos z para que quepa media fila + margen.
    const halfRow = ROW_WIDTH / 2 + FRAME_MARGIN;
    camera.position.z = Math.max(MIN_CAMERA_Z, halfRow / (Math.tan(halfFov) * aspect));
  }, [camera, size.width, size.height]);

  return null;
}

/** Parallax de cámara con el puntero (lerp) + pausa cuando no hay visibilidad. */
function CameraRig({ reduced, onContextLost }: { reduced: boolean; onContextLost?: () => void }) {
  const { camera, gl, invalidate } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Escuchamos en window: el parallax funciona aunque el cursor salga del canvas.
    const onPointer = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current = { x: nx * 1.6, y: -ny * 1.0 };
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [gl]);

  // Pausa del render loop cuando la pestaña está oculta (ahorro de batería)
  // y aviso al padre si el contexto WebGL muere (degradamos al byte 2D).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) gl.setAnimationLoop(null);
      else gl.setAnimationLoop(() => invalidate());
    };
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, [gl, invalidate, onContextLost]);

  useFrame((_, delta) => {
    if (reduced) return; // con reduced-motion la cámara queda quieta
    const k = 1 - Math.pow(0.001, delta); // lerp independiente del framerate
    camera.position.x += (target.current.x - camera.position.x) * k;
    camera.position.y += (target.current.y - camera.position.y) * k;
    // Miramos ligeramente por encima del centro: byte arriba, texto al centro.
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}

interface ByteSceneProps {
  reduced: boolean;
  /** Aviso de contexto WebGL perdido: el padre degrada al byte 2D. */
  onContextLost?: () => void;
}

export default function ByteScene({ reduced, onContextLost }: ByteSceneProps) {
  // En reduced-motion dibujamos un solo fotograma (frameloop="demand").
  // La callback de pérdida de contexto se guarda en ref para no recrear el Canvas.
  const lostRef = useRef(onContextLost);
  useEffect(() => {
    lostRef.current = onContextLost;
  }, [onContextLost]);

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 42 }}
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.35} />
      {/* Luz de relleno alta: acompaña a la fila elevada y al encuadre lejano */}
      <pointLight position={[0, 6, 10]} intensity={60} color={PHOSPHOR} />
      <ByteRow />
      {!reduced && <BinaryField />}
      <CameraFitter />
      <CameraRig reduced={reduced} onContextLost={() => lostRef.current?.()} />
    </Canvas>
  );
}
