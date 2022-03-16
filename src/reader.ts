import { statSync } from 'fs';
import type { FrameCfg } from './yuv/index';
import { YuvFormat } from './yuv/index';
import { read as readYuv } from "./io";


export default class Reader {
  constructor(src: string, config: FrameCfg) {
    this.cfg = config;
    if (!this.cfg.bits) this.cfg.bits = 8;
    if (!this.cfg.format) this.cfg.format = YuvFormat.YUV420;
    this.src = src;
  }

  public readonly cfg: FrameCfg;
  private readonly src: string;

  public get width(): number {
    return this.cfg.width;
  }
  public get height(): number {
    return this.cfg.height;
  }
  public get bits(): number {
    return this.cfg.bits!;
  }
  public get format(): YuvFormat {
    return this.cfg.format!;
  }
  public get length(): number {
    const bytes = statSync(this.src).size;
    const bytesPerPixel = Math.ceil(this.bits / 8);
    const pixelsY = this.width * this.height;

    let fmtFactor = 1;
    if (this.format === YuvFormat.YUV420) {fmtFactor = 1.5;}
    if (this.format === YuvFormat.YUV444) {fmtFactor = 3;}

    const bytesPerFrame = bytesPerPixel * pixelsY * fmtFactor;

    return bytes / bytesPerFrame;
  }

  public read(idx: number) {
    return readYuv(this.src, {...this.cfg, idx: idx});
  }
}
