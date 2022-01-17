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
    for (let x = 0; x < new_dims.width; x++) {
      let ref_idx = Math.round(y * dims.width * ratio.height + x * ratio.width);
      if (ref_idx >= im.length) ref_idx = im.length - 1;
      if (ref_idx < 0) ref_idx = 0;

      res[y * new_dims.width + x] = im[ref_idx];
    }
  }

  return res;
}
