import { files as test_files, test_o_path } from "./config";
import { read, write } from "../src/io";
import { copyFile, stat } from "fs/promises";
import { YuvFormat, FrameCfg } from '../src/yuv/index';

type TestFileKey = keyof typeof test_files;
const testFileIDs = Object.keys(test_files) as TestFileKey[];

test.each(
  testFileIDs.flatMap((testFileID) => {
    return [
      [0, testFileID],
      [5, testFileID],
      [9, testFileID]
    ]
  })
)(
  "should read a  yuv frame (idx = %d) in its correct format",
  async (frame_idx, file_id) => {
    const file = test_files[file_id as TestFileKey];
    const cfg: FrameCfg = {
      width: file.dimensions.width,
      height: file.dimensions.height,
      format: file.format as YuvFormat,
      bits: file.bits,
      idx: frame_idx as number
    };
    const yuv = await read(file.path, cfg);

    expect(yuv.format).toBe(file.format);
  }
);

test.each(testFileIDs)(
  "should throw when reading frame (idx = %d) > #frames in file (%s)",
  async (file_id: TestFileKey) => {
    const file = test_files[file_id];
    const cfg: FrameCfg = {
      width: file.dimensions.width,
      height: file.dimensions.height,
      format: file.format as YuvFormat,
      bits: file.bits,
      idx: file.frames 
    };
    await expect(async () => {await read(file.path, cfg)}).rejects.toThrow();
  }
);

test.each(testFileIDs)(
  "should throw when reading frames with bits > 32",
  async (file_id: TestFileKey) => {
    const file = test_files[file_id];
    const cfg: FrameCfg = {
      width: file.dimensions.width,
      height: file.dimensions.height,
      format: file.format as YuvFormat,
      bits: 33,
      idx:file.frames 
    };
    await expect(async () => {await read(file.path, cfg)}).rejects.toThrow();
  }
);

test.each(
  testFileIDs.flatMap((testFileID) => {
    return [
      [0, testFileID],
      [5, testFileID],
      [9, testFileID]
    ]
  })
)(
  "read and write a yuv frame from file %s with frame index %d",
  async (frame_idx, file_id) => {
    const file = test_files[file_id as TestFileKey];

    const cfg: FrameCfg = {
      width: file.dimensions.width,
      height: file.dimensions.height,
      format: file.format as YuvFormat,
      bits: file.bits,
      idx: frame_idx as number
    };

    const o_path = test_o_path + file_id + "_" + frame_idx + ".yuv";
    const yuv = await read(file.path, cfg);
    await write(o_path, yuv, 0);
    const yuv_test = await read(o_path, {...cfg, ...{ idx: 0} });

    expect(yuv.components).toStrictEqual(yuv_test.components);

    for (const component of yuv_test.components) {
      expect(yuv[component]).toStrictEqual(yuv_test[component]);
    }
  }
);

test.each(
  testFileIDs.flatMap((testFileID) => {
    return [
      [0, testFileID],
      [4, testFileID],
      [7, testFileID]
    ]
  })
)(
  "write a frame of a yuv file %s at a specific position %d",
  async (frame_idx, file_id) => {
    const file = test_files[file_id as TestFileKey];

    const cfg: FrameCfg = {
      width: file.dimensions.width,
      height: file.dimensions.height,
      format: file.format as YuvFormat,
      bits: file.bits,
      idx: frame_idx as number
    };
    const o_path = test_o_path + file_id + ".yuv";

    await copyFile(file.path, o_path);
    const frame = await read(file.path, cfg);
    await write(o_path, frame, frame_idx as number);

    expect((await stat(o_path)).size).toBe((await stat(file.path)).size);

    const frame_test = await read(o_path, cfg);
    expect(frame_test).toStrictEqual(frame);
  }
);
