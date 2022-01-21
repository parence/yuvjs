type Image = Uint8Array | Uint16Array | Uint32Array;
type Dimensions = {
  width: number;
  height: number;
};

export function nearestNeighbor(
  im: Image,
  dims: Dimensions,
  new_dims: Dimensions
) {
  const res: Image = new (Object.getPrototypeOf(im).constructor)(
    new_dims.width * new_dims.height
  );

  const ratio: Dimensions = {
    width: dims.width / new_dims.width,
    height: dims.height / new_dims.height,
  };

  for (let y = 0; y < new_dims.height; y++) {
    const ref_y = Math.floor((y + 0.5) * ratio.height);
    for (let x = 0; x < new_dims.width; x++) {
      const ref_x = Math.floor((x + 0.5) * ratio.width);

      res[x * new_dims.height + y] = im[ref_x * dims.height + ref_y];
    }
  }

  return res;
}
