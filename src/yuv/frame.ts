import { nearestNeighbor } from "../resize";

export type YuvComponentKey = "y" | "u" | "v";
export type YuvComponent = Uint8Array | Uint16Array | Uint32Array;
export type YuvComponents = {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;
};
export type YuvFormat = "444" | "420" | "400";

export class Frame {
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

    if (this.y.length != width * height) {
      let err = `Provided width ${width} and height ${height} do not `;
      err += `match length of provided Y component ${this.y.length}`;
      throw Error(err);
    }

    this.format; // check for invalid format

    this.width = width;
    this.height = height;

    this.bits = bits;
  }

  get widthChroma() {
    if (this.format === "444") return this.width;
    if (this.format === "420") return Math.round(this.width / 2);
    throw Error(`${this.format} has no chroma component!`);
  }

  get heightChroma() {
    if (this.format === "444") return this.height;
    if (this.format === "420") return Math.round(this.height / 2);
    throw Error(`${this.format} has no chroma component!`);
  }

  get format(): YuvFormat {
    if (!this.u && !this.v) return "400";

    const u_sz = this.u?.length;
    const v_sz = this.v?.length;

    if (u_sz !== v_sz)
      throw Error(`U (${u_sz}) and V (${v_sz}) dimensions dot not match!`);

    if (this.y.length === u_sz) return "444";
    if (0.25 * this.y.length === u_sz) return "420";

    throw Error("Invalid format!");
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

  /*
    returns a new Yuv object in the specified format
  */
  as(format: YuvFormat) {
    if (this.format === "400") throw Error("Unsupported conversion!");

    if (format === "400") {
      return new Frame(
        { y: new (Object.getPrototypeOf(this.y).constructor)(this.y) },
        this.width,
        this.height,
        this.bits
      );
    }

    const upsample = (() => {
      if (this.format === "420" && format === "444") return true;
      if (this.format === "444" && format === "420") return false;
      throw Error("Unsupported conversion!");
    })();

    const new_dims = {
      width: upsample ? this.widthChroma * 2 : Math.round(this.widthChroma / 2),
      height: upsample
        ? this.heightChroma * 2
        : Math.round(this.heightChroma / 2),
    };

    return new Frame(
      {
        y: this.y,
        u: nearestNeighbor(
          this.u!,
          { width: this.widthChroma, height: this.heightChroma },
          new_dims
        ),
        v: nearestNeighbor(
          this.v!,
          { width: this.widthChroma, height: this.heightChroma },
          new_dims
        ),
      },
      this.width,
      this.height,
      this.bits
    );
  }

  /*
    convert to RGBA and return as TypedArray
    the process is done in 2 steps: 
        1. conversion to yuv444 - nearest neighbor rescaling for upscaling chroma
        2. color conversion - following BT.470
    color conversion matrix: https://en.wikipedia.org/wiki/YUV#SDTV_with_BT.470
  */
  asRGBA() {
    const yuv444 = this.format === "444" ? this : this.as("444");
    // const rgba: YuvComponent = new (Object.getPrototypeOf(this.y).constructor)(
    const rgba: YuvComponent = new Uint8Array(
      this.y.length * 4
    );
    for (let index = 0; index < yuv444.y.length; index++) {
      const max_val = (1 << this.bits) - 1;

      const y = yuv444.y[index] / max_val;
      const u = yuv444.u![index] / max_val - 0.5;
      const v = yuv444.v![index] / max_val - 0.5;

      const norm = (num: number) => {
        return 255 * Math.min(Math.max(num, 0), 1);
      };

      const idx = index << 2;
      // BT.601
      rgba[idx] = norm(y + 1.402 * v);
      rgba[idx + 1] = norm(y - 0.344 * u - 0.714 * v);
      rgba[idx + 2] = norm(y + 1.772 * u);

      // BT.470
      //   rgba[idx] = norm(y + 1.13983 * v);
      //   rgba[idx + 1] = norm(y - 0.39465 * u - 0.5806 * v);
      //   rgba[idx + 2] = norm(y + 2.03211 * u);
      rgba[idx + 3] = max_val;
    }
    return rgba;
  }
}
