export type PinStatus = "approved" | "fix" | "unverified" | "pending";

export type Pin = {
  id: string;
  label: string;
  status: PinStatus;
  position: [number, number, number];
  note: string;
};

export type FlowPath = {
  id: string;
  kind: string;
  label: string;
  via: string[];
  status: PinStatus;
  caveat: string;
  note?: string;
};

export type PinFile = {
  version: number;
  units: string;
  originNote: string;
  pins: Pin[];
  paths: FlowPath[];
};

const STATUSES: PinStatus[] = ["approved", "fix", "unverified", "pending"];

function isVec3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

export function parsePinFile(data: unknown): PinFile {
  if (!data || typeof data !== "object") {
    throw new Error("pins.json is not an object.");
  }
  const raw = data as Partial<PinFile>;
  if (!Array.isArray(raw.pins)) {
    throw new Error("pins.json has no pins array.");
  }
  const pins: Pin[] = raw.pins.map((pin, index) => {
    if (!pin || typeof pin !== "object") {
      throw new Error(`Pin ${index} is not an object.`);
    }
    const row = pin as Partial<Pin>;
    if (typeof row.id !== "string" || row.id.length === 0) {
      throw new Error(`Pin ${index} is missing an id.`);
    }
    if (typeof row.label !== "string" || row.label.length === 0) {
      throw new Error(`Pin ${row.id} is missing a label.`);
    }
    if (!isVec3(row.position)) {
      throw new Error(`Pin ${row.id} needs a position of three numbers.`);
    }
    const status = STATUSES.includes(row.status as PinStatus)
      ? (row.status as PinStatus)
      : "unverified";
    return {
      id: row.id,
      label: row.label,
      status,
      position: row.position,
      note: typeof row.note === "string" ? row.note : "",
    };
  });

  const paths: FlowPath[] = Array.isArray(raw.paths)
    ? raw.paths.map((path, index) => {
        if (!path || typeof path !== "object") {
          throw new Error(`Path ${index} is not an object.`);
        }
        const row = path as Partial<FlowPath>;
        if (typeof row.id !== "string" || !Array.isArray(row.via)) {
          throw new Error(`Path ${index} needs an id and a via list.`);
        }
        return {
          id: row.id,
          kind: typeof row.kind === "string" ? row.kind : "schematic",
          label: typeof row.label === "string" ? row.label : row.id,
          via: row.via.filter((id): id is string => typeof id === "string"),
          status: STATUSES.includes(row.status as PinStatus)
            ? (row.status as PinStatus)
            : "pending",
          caveat:
            typeof row.caveat === "string"
              ? row.caveat
              : "Schematic flow path — not surveyed from the flyover.",
          note: typeof row.note === "string" ? row.note : undefined,
        };
      })
    : [];

  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    units: typeof raw.units === "string" ? raw.units : "scene-meters",
    originNote: typeof raw.originNote === "string" ? raw.originNote : "",
    pins,
    paths,
  };
}
