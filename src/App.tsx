import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PadScene } from "./pad-scene";
import { parsePinFile, type FlowPath, type Pin, type PinFile } from "./pins";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; file: PinFile };

function missingVia(file: PinFile): string[] {
  const ids = new Set(file.pins.map((pin) => pin.id));
  return file.paths.flatMap((path) =>
    path.via.filter((id) => !ids.has(id)).map((id) => `${path.id}: missing pin ${id}`),
  );
}

export function App() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.BASE_URL}pins.json`;
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`pins.json failed (${response.status}).`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        const file = parsePinFile(data);
        setState({ kind: "ready", file });
        setSelectedId(file.pins[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Could not load pins.";
        setState({ kind: "error", message });
      });
    return () => controller.abort();
  }, []);

  const file = state.kind === "ready" ? state.file : null;
  const selected = file?.pins.find((pin) => pin.id === selectedId) ?? null;
  const gaps = useMemo(() => (file ? missingVia(file) : []), [file]);
  const caveat =
    file?.paths.find((path) => path.caveat)?.caveat ??
    "Schematic flow path — not surveyed from the flyover.";

  function focusPin(pin: Pin) {
    setSelectedId(pin.id);
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.set(pin.position[0], pin.position[1], pin.position[2]);
    controls.update();
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="kicker">Rig pad</p>
          <h1>3D map</h1>
        </div>
        <p className="caveat">{caveat}</p>
      </header>

      <div className="stage">
        {state.kind === "loading" && <p className="banner">Loading pad pins…</p>}
        {state.kind === "error" && (
          <div className="banner is-error" role="alert">
            <p>Pin file did not load. {state.message}</p>
            <p>Refresh the page. If it still fails, the pins.json deploy is missing.</p>
          </div>
        )}
        {file && file.pins.length === 0 && (
          <p className="banner">No pins in pins.json yet.</p>
        )}
        {file && (
          <Canvas
            camera={{ position: [32, 28, 36], fov: 42, near: 0.1, far: 400 }}
            shadows
            aria-label="Orbitable rig pad. Drag to look around, scroll or pinch to zoom."
          >
            <PadScene
              pins={file.pins}
              paths={file.paths}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              controlsRef={controlsRef}
            />
          </Canvas>
        )}
      </div>

      <aside className="dock">
        <div className="pin-list" role="list">
          {file?.pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              role="listitem"
              className={`pin-btn${pin.id === selectedId ? " is-selected" : ""}`}
              onClick={() => focusPin(pin)}
            >
              <span className={`dot is-${pin.status}`} aria-hidden />
              <span>
                <strong>{pin.label}</strong>
                <small>{pin.status}</small>
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="detail">
            <p className="detail-title">{selected.label}</p>
            <p>{selected.note || "No note on this pin."}</p>
          </div>
        )}
        {file && file.paths.length > 0 && (
          <ul className="paths">
            {file.paths.map((path: FlowPath) => (
              <li key={path.id}>
                {path.label}
                {path.note ? ` ${path.note}` : ""}
              </li>
            ))}
          </ul>
        )}
        {gaps.length > 0 && (
          <p className="banner is-error" role="alert">
            Schematic path skipped a stop: {gaps.join("; ")}.
          </p>
        )}
      </aside>
    </div>
  );
}
