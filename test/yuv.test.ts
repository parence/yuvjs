import { Yuv } from "../src/yuv";

test("should have y, u and v components", () => {
  const data = new Uint8Array([]);
  const yuv = new Yuv({ y: data, u: data, v: data }, 0, 0, 8);

  expect(yuv.components).toEqual(["y", "u", "v"]);
});

test("should have only a y component", () => {
  const data = new Uint8Array([]);
  const yuv = new Yuv({ y: data }, 0, 0, 8);

  expect(yuv.components).toEqual(["y"]);
});

test.each([
  [0, 0, 1],
  [1, 1, 0],
  [1920, 1080, 1920 * 1080 + 1],
])(
  "should fail creating a Yuv 400 with dimensions (%d, %d) and Y data length of %d",
  (width, height, length) => {
    const data = new Uint8Array(length);

    expect(() => {
      new Yuv({ y: data }, width, height, 8);
    }).toThrow();
  }
);

test.each([
  [0, 0],
  [1, 1],
  [1920, 1080],
])(
  "should succeed creating a Yuv 400 with dimensions (%d, %d)",
  (width, height) => {
    const data = new Uint8Array(width * height);
    const yuv = new Yuv({ y: data }, width, height, 8);

    expect(yuv).toBeInstanceOf(Yuv);
  }
);

test.each([
  [
    [2, 4],
    [2, 4],
    [1, 4],
  ],
  [
    [2, 4],
    [1, 4],
    [2, 4],
  ],
  [
    [2, 4],
    [1, 4],
    [1, 4],
  ],
])(
  "should fail creating a Yuv with invalid format",
  (dims_y, dims_u, dims_v) => {
    const yuv = () => {
      const y = new Uint8Array(dims_y[0] * dims_y[1]);
      const u = new Uint8Array(dims_u[0] * dims_u[1]);
      const v = new Uint8Array(dims_v[0] * dims_v[1]);

      return new Yuv({ y: y, u: u, v: v }, dims_y[0], dims_y[1], 8);
    };

    expect(yuv).toThrow();
  }
);
