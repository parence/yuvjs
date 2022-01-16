import { files as test_files, test_o_path } from "./config";
import { read, write } from "../src/io";
import { copyFile, stat } from "fs/promises";
import { YuvFormat } from "../src/yuv";

type TestFileKey = keyof typeof test_files;

test.each([
  [0, "ducks_420"],
  [10, "ducks_420"],
  [50, "ducks_420"],
  [0, "stars_420"],
  [10, "stars_420"],
  [50, "stars_420"],
  [0, "stars_444"],
  [10, "stars_444"],
  [50, "stars_444"],
])(
  "should throw when reading frame (idx = %d) > #frames in file (%s)",
  async (frame_idx, file_id) => {
    const file = test_files[<TestFileKey>file_id];
    const yuv = await read(
      file.path,
      [file.dimensions.height, file.dimensions.width],
      {
        format: file.format as YuvFormat,
        bits: file.bits,
        idx: frame_idx,
      }
    );
    expect(yuv.format).toBe(file.format);
  }
);

test.each([
  [500, "ducks_420"],
  [55, "stars_420"],
  [1000, "stars_444"],
])(
  "should throw when reading frame (idx = %d) > #frames in file (%s)",
  async (frame_idx, file_id) => {
    const _read = async () => {
      const file = test_files[<TestFileKey>file_id];
      await read(file.path, [file.dimensions.height, file.dimensions.width], {
        format: file.format as YuvFormat,
        bits: file.bits,
        idx: frame_idx,
      });
    };
    await expect(_read).rejects.toThrow();
  }
);

const files_frames: Array<Array<string | number>> = [];
const frames = [0, 20, 54];
const files = Object.keys(test_files);
// const files = ['stars_444'], frames = [0, 55];

files.forEach((id) => {
  frames.forEach((idx) => {
    files_frames.push([id, idx]);
  });
});
test.each(files_frames)(
  "read and write a yuv frame from file %s with frame index %d",
  async (file_id, frame_idx) => {
    // const id = <TestFileKey>Object.keys(test_files)[0];
    const file = test_files[<TestFileKey>file_id];

    const width = file.dimensions.width;
    const height = file.dimensions.height;
    const path = file.path;

    const o_path = test_o_path + file_id + "_" + frame_idx + ".yuv";

    const frame_cfg = { format: file.format as YuvFormat, bits: file.bits };
    const yuv = await read(path, [height, width], {
      ...frame_cfg,
      ...{ idx: <number>frame_idx },
    });

    await write(o_path, yuv, 0);
    const yuv_test = await read(o_path, [height, width], {
      ...frame_cfg,
      ...{ idx: 0 },
    });

    expect(yuv.components).toStrictEqual(yuv_test.components);

    for (const component of yuv_test.components) {
      expect(yuv[component]).toStrictEqual(yuv_test[component]);
    }
  }
);

test.each(files_frames)(
  "write a frame of a yuv file %s at a specific position %d",
  async (file_id, frame_idx) => {
    const file = test_files[<TestFileKey>file_id];
    const o_path = test_o_path + file_id + ".yuv";

    await copyFile(file.path, o_path);

    const frame_cfg = { format: file.format as YuvFormat, bits: file.bits };
    const frame = await read(
      file.path,
      [file.dimensions.height, file.dimensions.width],
      {
        ...frame_cfg,
        ...{ idx: <number>frame_idx },
      }
    );

    await write(o_path, frame, <number>frame_idx);

    expect((await stat(o_path)).size).toBe((await stat(file.path)).size);

    const frame_test = await read(
      o_path,
      [file.dimensions.height, file.dimensions.width],
      {
        ...frame_cfg,
        ...{ idx: <number>frame_idx },
      }
    );

    expect(frame_test).toStrictEqual(frame);
  }
);
