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

test("converts yuv 420 to yuv 444", () => {
  const yuv420 = new Yuv(
    {
      y: new Uint8Array([1, 1, 1, 1]),
      u: new Uint8Array([2]),
      v: new Uint8Array([3]),
    },
    2,
    2,
    8
  );

  const yuv444 = yuv420.as("444");

  expect(yuv444.format).toBe("444");

  expect(yuv444.width).toBe(yuv420.width);
  expect(yuv444.height).toBe(yuv420.height);
  expect(yuv444.widthChroma).toBe(yuv444.width);
  expect(yuv444.heightChroma).toBe(yuv444.height);

  expect(yuv444.y).toEqual(yuv420.y);
  expect(yuv444.u).toStrictEqual(new Uint8Array([2, 2, 2, 2]));
  expect(yuv444.v).toStrictEqual(new Uint8Array([3, 3, 3, 3]));
});

test("converts yuv 444 to yuv 420", () => {
  const yuv444 = new Yuv(
    {
      y: new Uint8Array([1, 1, 1, 1]),
      u: new Uint8Array([2, 2, 2, 2]),
      v: new Uint8Array([3, 3, 3, 3]),
    },
    2,
    2,
    8
  );

  const yuv420 = yuv444.as("420");

  expect(yuv420.format).toBe("420");

  expect(yuv420.width).toBe(yuv444.width);
  expect(yuv420.height).toBe(yuv444.height);
  expect(yuv420.widthChroma).toBe(yuv444.width / 2);
  expect(yuv420.heightChroma).toBe(yuv444.height / 2);

  expect(yuv420.y).toEqual(yuv444.y);
  expect(yuv420.u).toStrictEqual(new Uint8Array([2]));
  expect(yuv420.v).toStrictEqual(new Uint8Array([3]));
});

test("converts yuv 444 to yuv 400", () => {
  const yuv444 = new Yuv(
    {
      y: new Uint8Array([1, 1, 1, 1]),
      u: new Uint8Array([2, 2, 2, 2]),
      v: new Uint8Array([3, 3, 3, 3]),
    },
    2,
    2,
    8
  );

  const yuv400 = yuv444.as("400");

  expect(yuv400.format).toBe("400");

  expect(yuv400.width).toBe(yuv444.width);
  expect(yuv400.height).toBe(yuv444.height);

  expect(() => {
    yuv400.widthChroma;
  }).toThrow();
  expect(() => {
    yuv400.heightChroma;
  }).toThrow();

  expect(yuv400.y).toEqual(yuv444.y);
  expect(yuv400.u).toBeUndefined();
  expect(yuv400.v).toBeUndefined();
});

test("should fail converting from yuv400 to yuv 420", () => {
  const yuv400 = new Yuv(
    {
      y: new Uint8Array([1, 1, 1, 1]),
    },
    2,
    2,
    8
  );

  expect(() => {
    yuv400.as("420");
  }).toThrow();
});

test("should fail converting from yuv400 to yuv 444", () => {
  const yuv400 = new Yuv(
    {
      y: new Uint8Array([1, 1, 1, 1]),
    },
    2,
    2,
    8
  );

  expect(() => {
    yuv400.as("444");
  }).toThrow();
});
