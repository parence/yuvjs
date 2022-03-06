import { open, stat } from "fs/promises";
import {
  Frame,
  YuvComponents,
  YuvComponent,
  YuvComponentKey,
  YuvFormat,
} from "./yuv/frame";

export interface FrameCfg {
  width: number;
  height: number;
  format?: YuvFormat;
  bits?: number;
  idx?: number;
}

/*
read a YUV frame
*/
async function read(
  src: string,
  cfg: FrameCfg
): Promise<Frame> {
  const _cfg: FrameCfg = { ...{ format: "420", bits: 8, idx: 0 }, ...cfg };
  const bits = <number>_cfg.bits;
  const format = <string>_cfg.format;
  const idx = <number>_cfg.idx;
  const dims = [_cfg.height, _cfg.width];

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
    let err = `Can't access frame with idx ${idx}! `;
    err += `The file only has ${nr_frames} frames!`;
    throw new Error(err);
  }

  const file = await open(src, "r");
  let offset = idx * FRAME_BYTES;
  const frame: Record<string, YuvComponent> = {};
  for (let index = 0; index < planes.length; index++) {
    const plane = planes[index];

    const plane_raw = (await file.read(
      new Uint8Array(new ArrayBuffer(bytes * dbytes(planeDims(plane)))),
      0, bytes * dbytes(planeDims(plane)), offset
    )).buffer;

    frame[plane] = new dtypes[bytes](dbytes(planeDims(plane)));
    for (let idx = 0; idx < frame[plane].length; idx++) {
      frame[plane][idx] = Array(bytes).fill(0).reduce(
        (val, _, byte_index) => {
          // assume little endian => TODO implement big endian?
          return val + (plane_raw[bytes * idx + byte_index] << (8 * byte_index));
        }, 0
      );
    }

    // frame[plane] = new dtypes[bytes](
    //   (await file.read(
    //     new dtypes[bytes](
    //       new ArrayBuffer(bytes * dbytes(planeDims(plane))),
    //       0,
    //       dbytes(planeDims(plane))
    //     ), 0, bytes * dbytes(planeDims(plane)), offset
    //   )).buffer
    // );
    offset += frame[plane].byteLength;
  }
  file.close();

  const [width, height] = dims;
  return new Frame(<YuvComponents>frame, width, height, bits);
}

/*
write a yuv frame
*/
async function write(src: string, frame: Frame, idx?: number) {
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
