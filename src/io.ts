import { open, stat } from "fs/promises";

interface FrameCfg {
  format?: string;
  bits?: number;
  idx?: number;
}

type YuvComponentKey = "y" | "u" | "v";
type YuvComponent = Uint8Array | Uint16Array | Uint32Array;
type YuvComponents = { y: YuvComponent; u?: YuvComponent; v?: YuvComponent };

interface IYuv {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;

  components: Array<YuvComponentKey>;
}

class Yuv implements IYuv {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;

  width: number;
  height: number;

  bits: number;

  constructor(
    data: YuvComponents,
    width: number,
    height: number,
    bits: number
  ) {
    const _comps = { ...{ u: undefined, v: undefined }, ...data };
    this.y = _comps.y;
    this.u = _comps.u;
    this.v = _comps.v;

    this.width = width;
    this.height = height;

    this.bits = bits;
  }

  get components() {
    const _comps: Array<YuvComponentKey> = ["y"];

    if (this.u) {
      _comps.push("u");
    }
    if (this.v) {
      _comps.push("v");
    }

    return _comps;
  }

  get bytes_per_frame() {
    const bytes = this.components.reduce<number>(
      (bytes: number, comp: YuvComponentKey) => {
        return bytes + this[comp]!.byteLength;
      },
      0
    );
    return bytes;
  }
}

/*
read a YUV frame
*/
async function read(src: string, dims: [number, number], cfg?: FrameCfg) {
  const _cfg: FrameCfg = { ...{ format: "420", bits: 8, idx: 0 }, ...cfg };
  const bits = _cfg.bits!;
  const format = _cfg.format;
  const idx = _cfg.idx!;

  const dtypes = {
    1: Uint8Array,
    2: Uint16Array,
    3: Uint32Array,
    4: Uint32Array,
  };

  const bytes = (() => {
    const _bytes = Math.ceil(bits / 8);
    if (!(_bytes in dtypes)) {
      throw Error("Invalid number of bits!");
    }
    return <keyof typeof dtypes>_bytes;
  })();

  const planeDims = (plane: string): [number, number] => {
    const IS_CHROMA = ["u", "v"].includes(plane);
    const downsample = IS_CHROMA && format === "420" ? 2 : 1;
    return [dims[0] / downsample, dims[1] / downsample];
  };

  const dbytes = (dims: [number, number]) => {
    return dims[0] * dims[1];
  };
  const planes: Array<YuvComponentKey> =
    format === "400" ? ["y"] : ["y", "u", "v"];

  const FRAME_BYTES =
    bytes * planes.reduce((size, plane) => size + dbytes(planeDims(plane)), 0);

  const nr_frames = (await stat(src)).size / FRAME_BYTES;
  if (idx >= nr_frames) {
    let err = `Can't access frame with idx ${idx}! `
    err += `The file only has ${nr_frames} frames!`;
    throw new Error(err);
  }

  const file = await open(src, "r");
  let frame: Record<string, YuvComponent> = {};
  for (let index = 0; index < planes.length; index++) {
    const plane = planes[index];

    frame[plane] = dtypes[bytes].from(
      (
        await file.read(
          new dtypes[bytes](Buffer.alloc(dbytes(planeDims(plane)))),
          0,
          dbytes(planeDims(plane)),
          idx * FRAME_BYTES
        )
      ).buffer
    );
  }
  file.close();

  let [width, height] = dims;
  return new Yuv(<YuvComponents>frame, width, height, bits);
}

/*
write a yuv frame
*/
async function write(src: string, frame: Yuv, idx?: number) {
  let offset = (idx || 0) * frame.bytes_per_frame;

  (await open(src, "a")).close(); // create an empty file if it does not exist
  const file = await open(src, "r+");

  for (const component of frame.components) {
    await file.write(
      Buffer.from(<YuvComponent>frame[component]),
      0,
      null,
      offset
    );
    offset += (<YuvComponent>frame[component]).byteLength;
  }
  file.close();
}

export { read, write };
