export * from "./frame";

export type YuvComponent = Uint8Array | Uint16Array | Uint32Array;
export type YuvComponents = {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;
};
export type YuvComponentKey = keyof YuvComponents;

export enum YuvFormat {
  YUV420 = "420",
  YUV444 = "444",
  YUV400 = "400"
}
// export type YuvFormat = Yuv444Format | Yuv420Format | Yuv400Format;
