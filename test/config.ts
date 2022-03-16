const base_path = "./test/data/";
export const test_o_path = base_path + "output/";

export const files = {
  fish_420: {
    path: base_path + "fish_420_25_320x180_10.yuv",
    format: "420",
    dimensions: { width: 320, height: 180 },
    bits: 10,
    frames: 25
  },
  fish_444: {
    path: base_path + "fish_444_40_280x158_8.yuv",
    format: "444",
    dimensions: { width: 280, height: 158 },
    bits: 8,
    frames: 40 
  },
  winter_420: {
    path: base_path + "winter_420_10_220x124_8.yuv",
    format: "420",
    dimensions: { width: 220, height: 124 },
    bits: 8,
    frames: 10 
  },
  winter_444: {
    path: base_path + "winter_444_20_260x146_10.yuv",
    format: "444",
    dimensions: { width: 260, height: 146 },
    bits: 10,
    frames: 20 
  }
};
