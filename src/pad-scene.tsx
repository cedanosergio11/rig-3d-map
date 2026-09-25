import { useMemo, type RefObject } from "react";
import { Html, Line, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { FlowPath, Pin, PinStatus } from "./pins";

const STATUS_COLOR: Record<PinStatus, string> = {
  approved: "#1f6b4a",
  unverified: "#b86e00",
  fix: "#9a3412",
  pending: "#9a3412",
};

type Props = {
  pins: Pin[];
  paths: FlowPath[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  controlsRef: RefObject<OrbitControlsImpl>;
};

function statusColor(status: PinStatus): string {
  return STATUS_COLOR[status];
}

function Mass({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0.04} />
    </mesh>
  );
}

function Derrick() {
  const legs: [number, number][] = [
    [-1.3, -1.3],
    [1.3, -1.3],
    [1.3, 1.3],
    [-1.3, 1.3],
  ];
  return (
    <group>
      {legs.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 16, z]} castShadow>
          <boxGeometry args={[0.35, 26, 0.35]} />
          <meshStandardMaterial color="#e7e4dc" roughness={0.55} metalness={0.2} />
        </mesh>
      ))}
      {[6, 12, 18, 24].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[3.1, 0.18, 3.1]} />
          <meshStandardMaterial color="#d6d2c8" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 28.4, 0]}>
        <boxGeometry args={[3.4, 1.1, 3.4]} />
        <meshStandardMaterial color="#e2b123" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Substructure() {
  const posts: [number, number][] = [
    [-6, -5],
    [6, -5],
    [6, 5],
    [-6, 5],
    [-6, 0],
    [6, 0],
    [0, -5],
    [0, 5],
  ];
  return (
    <group>
      {posts.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 1.5, z]} castShadow>
          <boxGeometry args={[0.45, 3, 0.45]} />
          <meshStandardMaterial color="#8d9398" roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 3.15, 0]} receiveShadow>
        <boxGeometry args={[13.2, 0.28, 11.2]} />
        <meshStandardMaterial color="#6e757b" roughness={0.72} metalness={0.12} />
      </mesh>
    </group>
  );
}

function SchematicPath({
  path,
  pins,
}: {
  path: FlowPath;
  pins: Pin[];
}) {
  const byId = useMemo(() => new Map(pins.map((pin) => [pin.id, pin])), [pins]);
  const points = path.via
    .map((id) => byId.get(id))
    .filter((pin): pin is Pin => pin !== undefined)
    .map((pin) => [pin.position[0], pin.position[1] + 1.4, pin.position[2]] as [number, number, number]);

  if (points.length < 2) return null;

  return (
    <group>
      <Line points={points} color="#e85d04" lineWidth={4} />
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1];
        const mid: [number, number, number] = [
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2 + 0.15,
          (start[2] + end[2]) / 2,
        ];
        return (
          <mesh key={`${path.id}-${index}`} position={mid}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color="#e85d04" emissive="#e85d04" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function PinMarker({
  pin,
  selected,
  onSelect,
}: {
  pin: Pin;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const color = statusColor(pin.status);
  return (
    <group position={pin.position}>
      <mesh
        position={[0, 0.7, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(pin.id);
        }}
      >
        <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh
        position={[0, 1.5, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(pin.id);
        }}
      >
        <sphereGeometry args={[selected ? 0.55 : 0.42, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.35 : 0.12} />
      </mesh>
      <Html position={[0, 2.3, 0]} center distanceFactor={28} zIndexRange={[20, 0]}>
        <button
          type="button"
          className={`pin-label${selected ? " is-selected" : ""}`}
          style={{ borderColor: color }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(pin.id);
          }}
        >
          {pin.label}
        </button>
      </Html>
    </group>
  );
}

export function PadScene({ pins, paths, selectedId, onSelect, controlsRef }: Props) {
  const target = pins.find((pin) => pin.id === selectedId)?.position ?? [0, 2, 0];

  return (
    <>
      <color attach="background" args={["#d7e3ea"]} />
      <hemisphereLight args={["#f4f7fb", "#8a5a3a", 0.85]} />
      <directionalLight position={[40, 60, 20]} intensity={1.35} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={() => onSelect("")}>
        <planeGeometry args={[120, 90]} />
        <meshStandardMaterial color="#8d5a3c" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[34, 36, 48]} />
        <meshStandardMaterial color="#a56b48" roughness={1} />
      </mesh>

      <Derrick />
      <Substructure />
      <Mass position={[-2, 0.35, 14]} size={[4, 0.5, 16]} color="#c4b8a4" />
      <Mass position={[16, 0.55, 14]} size={[8, 0.9, 3.2]} color="#e7a8b0" />
      <Mass position={[16, 0.7, 18]} size={[8, 0.9, 3.2]} color="#e7a8b0" />
      <Mass position={[8, 1.1, 9]} size={[6.5, 1.6, 2.4]} color="#3d4450" />
      <Mass position={[22, 1.3, -8]} size={[7, 2.2, 3.2]} color="#f4f7f8" />
      <Mass position={[22, 1.5, -3]} size={[6, 2.6, 3]} color="#e8eef2" />
      <Mass position={[18, 1.4, 1]} size={[5, 2.2, 2.6]} color="#4d79a8" />
      <Mass position={[-28, 1.6, -16]} size={[16, 2.8, 3.2]} color="#f7f7f5" />
      <Mass position={[30, 1.6, -18]} size={[18, 2.8, 3.2]} color="#f7f7f5" />

      {paths
        .filter((path) => path.kind === "schematic")
        .map((path) => (
          <SchematicPath key={path.id} path={path} pins={pins} />
        ))}

      {pins.map((pin) => (
        <PinMarker key={pin.id} pin={pin} selected={pin.id === selectedId} onSelect={onSelect} />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={target}
        enableDamping
        maxPolarAngle={Math.PI / 2.15}
        minDistance={12}
        maxDistance={90}
      />
    </>
  );
}
