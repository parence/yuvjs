export type YuvComponentKey = "y" | "u" | "v";
export type YuvComponent = Uint8Array | Uint16Array | Uint32Array;
export type YuvComponents = {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;
};

export interface IYuv {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;

  components: Array<YuvComponentKey>;
}

export class Yuv implements IYuv {
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
    if (_comps.u) this.u = _comps.u;
    if (_comps.v) this.v = _comps.v;

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
        return bytes + (this[comp]?.byteLength ?? 0);
      },
      0
    );
    return bytes;
  }
}
