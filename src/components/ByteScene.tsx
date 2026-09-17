// ByteScene: escena 3D del día 256 (three.js vía @react-three/fiber).
// - Los ocho cubos SON los bits del byte 01010101: cada cubo lleva su dígito
//   INCURSTADO en las caras (textura generada en canvas con zócalo hundido y
//   dígito brillante, estética de chip). Los "1" brillan más que los "0".
// - Los cubos PERMANECEN presentes: sin animación de entrada (aparecen en el
//   primer fotograma) y sin desmontado. Si el contexto WebGL se pierde se
//   intenta restaurar; solo si muere de forma fatal se avisa a Celebration
//   (onFatal) para que el byte 2D del DOM tome el relevo.
// - Campo de partículas binarias con Drei y parallax de cámara con el puntero
//   (reduced-motion: cámara quieta, render bajo demanda, sin partículas).
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group, Mesh, PerspectiveCamera } from "three";
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from "three";

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

// ── Texturas incrustadas (canvas 2D -> CanvasTexture) ───────────────────────

interface FaceTextures {
  map: CanvasTexture;
  emissive: CanvasTexture;
}

/** Cache por dígito: solo hay dos texturas posibles (0 y 1). */
const faceTextureCache = new Map<string, FaceTextures>();

/**
 * Genera la textura de las caras de un cubo-bit:
 * - "map": cuerpo del chip (degradado), marco, zócalo hundido y dígito
 * - "emissive": negro salvo el dígito en fósforo, para que brille incrustado
 */
function getFaceTextures(digit: string): FaceTextures {
  const cached = faceTextureCache.get(digit);
  if (cached) return cached;

  const size = 256;
  const map = document.createElement("canvas");
  map.width = size;
  map.height = size;
  const ctx = map.getContext("2d")!;
  const emissive = document.createElement("canvas");
  emissive.width = size;
  emissive.height = size;
  const ectx = emissive.getContext("2d")!;

  // Cuerpo del chip: degradado verde oscuro
  const body = ctx.createLinearGradient(0, 0, 0, size);
  body.addColorStop(0, "#0f3524");
  body.addColorStop(1, "#071b12");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, size, size);

  // Marco exterior del encapsulado
  ctx.strokeStyle = "rgba(85, 255, 136, 0.4)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  // Zócalo hundido donde va incrustado el dígito
  const socket = 52;
  ctx.fillStyle = "#04120b";
  ctx.fillRect(socket, socket, size - socket * 2, size - socket * 2);
  // Bisel de hundimiento: sombra arriba-izquierda, luz abajo-derecha
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(socket, socket + size - socket * 2 - 2.5);
  ctx.lineTo(socket, socket);
  ctx.lineTo(socket + size - socket * 2, socket);
  ctx.stroke();
  ctx.strokeStyle = "rgba(85, 255, 136, 0.28)";
  ctx.beginPath();
  ctx.moveTo(socket + 2.5, size - socket);
  ctx.lineTo(size - socket, size - socket);
  ctx.lineTo(size - socket, socket + 2.5);
  ctx.stroke();

  // Dígito incrustado: halo suave + núcleo claro, centrado en el zócalo
  const font = `bold 138px "JetBrains Mono Variable", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.shadowColor = PHOSPHOR;
  ctx.shadowBlur = 26;
  ctx.fillStyle = "rgba(85, 255, 136, 0.85)";
  ctx.fillText(digit, size / 2, size / 2 + 6);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#d8ffe8";
  ctx.fillText(digit, size / 2, size / 2 + 6);

  // Emissive: negro absoluto salvo el dígito (solo el bit emite luz)
  ectx.fillStyle = "#000000";
  ectx.fillRect(0, 0, size, size);
  ectx.textAlign = "center";
  ectx.textBaseline = "middle";
  ectx.font = font;
  ectx.shadowColor = PHOSPHOR;
  ectx.shadowBlur = 18;
  ectx.fillStyle = PHOSPHOR;
  ectx.fillText(digit, size / 2, size / 2 + 6);
  ectx.shadowBlur = 0;
  ectx.fillStyle = "#ffffff";
  ectx.fillText(digit, size / 2, size / 2 + 6);

  const mapTex = new CanvasTexture(map);
  mapTex.colorSpace = SRGBColorSpace;
  const emissiveTex = new CanvasTexture(emissive);
  emissiveTex.colorSpace = SRGBColorSpace;

  const entry = { map: mapTex, emissive: emissiveTex };
  faceTextureCache.set(digit, entry);
  return entry;
}

/**
 * Un cubo-bit: el dígito incrustado brilla (los "1" más que los "0"), flota
 * suavemente y oscila con vaivén propio. Aparece en el primer fotograma y
 * permanece: sin animación de entrada ni salida.
 */
function BitCube({
  position,
  digit,
  lit,
  index,
}: {
  position: [number, number, number];
  digit: string;
  lit: boolean;
  index: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const phase = index * 0.9;
  const { map, emissive } = useMemo(() => getFaceTextures(digit), [digit]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    // Flotación suave; los "1" giran un poco más para dar vida al byte.
    mesh.position.y = position[1] + Math.sin(t * 1.2 + phase) * 0.1;
    mesh.rotation.y = Math.sin(t * 0.35 + phase) * (lit ? 0.3 : 0.16);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.82, 0.82, 0.82]} />
      <meshStandardMaterial
        map={map}
        emissive="#ffffff"
        emissiveMap={emissive}
        emissiveIntensity={lit ? 1.25 : 0.55}
        roughness={0.55}
        metalness={0.15}
      />
    </mesh>
  );
}

/** La fila 01010101, elevada sobre el titular, con balanceo orbital. */
function ByteRow() {
  // El byte pedido: 0 1 0 1 0 1 0 1 (los "1" brillan más).
  const pattern = ["0", "1", "0", "1", "0", "1", "0", "1"];
  const groupWrapRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const wrap = groupWrapRef.current;
    if (!wrap) return;
    // Órbita de balanceo del byte completo.
    wrap.rotation.y = Math.sin(clock.getElapsedTime() * 0.25) * 0.18;
  });

  return (
    <group ref={groupWrapRef} position={[0, BYTE_Y, 0]}>
      {pattern.map((digit, i) => (
        <BitCube
          key={i}
          index={i}
          digit={digit}
          lit={digit === "1"}
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
    const halfRow = ROW_WIDTH / 2 + FRAME_MARGIN;
    camera.position.z = Math.max(MIN_CAMERA_Z, halfRow / (Math.tan(halfFov) * aspect));
  }, [camera, size.width, size.height]);

  return null;
}

/**
 * Guardia de contexto: si WebGL se pierde, preventDefault habilita la
 * restauración. Solo si el navegador informa de pérdida FATAL (sin
 * posibilidad de restaurar) avisamos a Celebration para que el byte 2D
 * tome el relevo: el canvas nunca se desmonta por una pérdida normal.
 */
function ContextGuard({ onFatal }: { onFatal?: () => void }) {
  const gl = useThree((state) => state.gl);
  const [, bump] = useState(0);
  const fatalRef = useRef(onFatal);
  useEffect(() => {
    fatalRef.current = onFatal;
  }, [onFatal]);

  useEffect(() => {
    const canvas = gl.domElement;
    // Si el contexto no se restaura en este plazo, lo tratamos como fatal:
    // mejor entregar el relevo al byte 2D que dejar un canvas vacío.
    let restoreTimer = 0;
    const armRestoreTimer = () => {
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => fatalRef.current?.(), 1_500);
    };
    const onLost = (event: Event) => {
      event.preventDefault(); // habilita la restauración del contexto
      // statusMessage "internal error" = pérdida fatal (GPU caída, sin
      // restauración posible). Una pérdida normal llega con mensaje vacío.
      if ((event as WebGLContextEvent).statusMessage === "internal error") {
        fatalRef.current?.();
        return;
      }
      armRestoreTimer();
      bump((n) => n + 1);
    };
    const onRestored = () => {
      window.clearTimeout(restoreTimer);
      bump((n) => n + 1);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      window.clearTimeout(restoreTimer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl]);

  return null;
}

/** Parallax de cámara con el puntero (lerp) + pausa cuando no hay visibilidad. */
function CameraRig({ reduced }: { reduced: boolean }) {
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

  // Pausa del render loop cuando la pestaña está oculta (ahorro de batería).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) gl.setAnimationLoop(null);
      else gl.setAnimationLoop(() => invalidate());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [gl, invalidate]);

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

interface ByteSceneProps {
  reduced: boolean;
  /** Aviso de que el canvas 3D ya está creado (oculta el byte 2D de reserva). */
  onReady?: () => void;
  /** El contexto WebGL murió de forma fatal: el byte 2D toma el relevo. */
  onFatal?: () => void;
}

export default function ByteScene({ reduced, onReady, onFatal }: ByteSceneProps) {
  // Las callbacks se guardan en refs para no recrear el Canvas.
  const readyRef = useRef(onReady);
  const fatalRef = useRef(onFatal);
  useEffect(() => {
    readyRef.current = onReady;
    fatalRef.current = onFatal;
  }, [onReady, onFatal]);

  return (
    <Canvas
      camera={{ position: [0, 0, MIN_CAMERA_Z], fov: 42 }}
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => readyRef.current?.()}
    >
      <ambientLight intensity={0.35} />
      {/* Luz de relleno alta: acompaña a la fila elevada y al encuadre lejano */}
      <pointLight position={[0, 6, 10]} intensity={60} color={PHOSPHOR} />
      <ByteRow />
      {!reduced && <BinaryField />}
      <CameraFitter />
      <CameraRig reduced={reduced} />
      <ContextGuard onFatal={() => fatalRef.current?.()} />
    </Canvas>
  );
}
