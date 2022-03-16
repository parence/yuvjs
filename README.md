# yuvjs

yuvjs is a library for handling frames encoded in [Yuv](https://en.wikipedia.org/wiki/YUV) format.

At it's core, it provides the [Frame](./src/yuv/frame.ts) class, which holds the actual frame data (in YUV 444, 420 or 400 formats) and supports simple manipulations, which include conversion from one YUV format to another and conversion to RGBA. 
The library also allows to read and write YUV data in various pixel [formats](#framecfg).
## IO

The [io](./src/io.ts) module exports two functions [read](#read) and [write](#write) for reading and writing frames respectively.

### read

```ts 
async function read(src: string, cfg: FrameCfg)
```
where `src` is the path to the YUV file and cfg is a [FrameCfg](#framecfg) object describing the YUV properties and the frame idx to read. The frame will be represented as a [Frame](#frame) object.

### write

```ts
async function write(src: string, frame: Frame, idx?: number)
```

where `src` is the path to the file to write the YUV frame, frame is a [Frame](#frame) object and idx corresponds to the position in the YUV sequence the frame should be written to. If no idx is provided, the frame will be appended at the end of the file. If the file at `src` does not exist it will be created.

### Reader

a YUV frame reader class, that exposes a `read(idx)` method, handy for sequentially reading multiple frames from the same file.
## FrameCfg

is an object holding all the necessary information about a frame configuration.
```ts
{ 
    width: number, height: number, 
    format?: YuvFormat, bits?: number, idx?: number
}
```
where `width` and `height` are the width and height in pixels of the luma (Y) component of the frame, `format` is the YUV format, `bits` is the bitdepth of each pixel of each plane, and `idx` is the frame idx.

Supported values for `format` and `bits`:
- `format`: `['444', '420', '400']`
- `bits`: `[1, 32]`

## Frame

holds the actual frame data as separate `UintArrays` (`Uint8Array`, `Uint16Array` or `Uint32Array` depending on the `bits` per plane pixel) for each color plane (`Frame.y`, `Frame.u` and `Frame.v`, depending on the YUV format) and provides methods to convert between different YUV formats as well as to RGBA. See [examples](#examples) for details.

## Examples

```ts
import { read, write, Reader, Frame, FrameCfg } from 'yuvjs';

/* define a Yuv frame, which is the third frame 
    of a sequence in 420 format with a bitdepth of 10
*/
const cfg: FrameCfg = {
    width: 1280, height: 720,
    format: '420', bits: 10, idx: 2
};

// read the third frame of a yuv video with yuv42010p pixel format
const frame: Frame = await read('path_to_yuv_file.yuv', cfg);

console.log(frame.width); // 1280
console.log(frame.widthChroma); // 640
console.log(frame.format); // 420
console.log(frame.components); // [y, u, v]

// convert to yuv444
// nearest neighbor is used to interpolate missing data
const frame444: Frame = frame.as('444');
console.log(frame444.width); // 1280
console.log(frame444.height); // 1280

// overwrite second frame in `yuv444.yuv`
await write('yuv444.yuv', frame444, 1);

// conver to RGBA
// nearest neighbor is used to inerpolate missing data
// color conversion is done following BT.470
// the data is quantized to 8 bits per channel
const frameRGBA: Uint8Array = frame.asRGBA();
// frameRGBA is a Uint8Array of size (frame.width * frame.height * 4)

const reader = new Reader('file.yuv', cfg);
console.log(reader.length); // the number of frames in 'file.yuv'
const frame1 = await reader.read(0); // read the first frame
const frame2 = await reader.read(1); // read the second frame
```
