export * from "./frame";

export type YuvComponentKey = "y" | "u" | "v";
export type YuvComponent = Uint8Array | Uint16Array | Uint32Array;
export type YuvComponents = {
  y: YuvComponent;
  u?: YuvComponent;
  v?: YuvComponent;
};
export type YuvFormat = "444" | "420" | "400";
