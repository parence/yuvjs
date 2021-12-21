import { open } from 'fs/promises';

interface FrameCfg {
  format?: string;
  bits?: number;
  idx?: number;
}

interface YUV {
    y: Uint8Array,
    u?: Uint8Array,
    v?: Uint8Array
}

async function read(
  src: string,
  dims: [number, number],
  cfg?: FrameCfg 
) {
    const _cfg: FrameCfg = {...{format: '420', bits: 8, idx: 0}, ...cfg};
    const bits = _cfg.bits!;
    const format = _cfg.format;
    const idx = _cfg.idx!;

    const dtypes = {
        1: Uint8Array,
        2: Uint16Array,
        3: Uint32Array,
        4: Uint32Array
    };

    const bytes = (() => {
        const _bytes = Math.ceil(bits / 8);
        if (!(_bytes in dtypes)) {
            throw Error('Invalid number of bits!');
        }
        return <keyof typeof dtypes>_bytes;
    })();


    const planeDims = (plane: string) : [number, number] => {
        const IS_CHROMA = ['u', 'v'].includes(plane);
        const downsample = IS_CHROMA && format === '420' ? 2 : 1;
        return [dims[0] / downsample, dims[1] / downsample];
    };

    const dbytes = (dims: [number, number]) => {return dims[0] * dims[1];};
    const planes = format === '400' ? ['y'] : ['y', 'u', 'v'];

    const FRAME_BYTES = bytes * planes.reduce(
        (size, plane) => (size + dbytes(planeDims(plane))), 0
    );
    const file = await open(src, 'r');
    let yuv = {};
    for (let index = 0; index < planes.length; index++) {
        const plane = planes[index];

        (yuv as any)[plane] = dtypes[bytes].from((
            await file.read(
                new Uint8Array(Buffer.alloc(dbytes(planeDims(plane)))),
                0, dbytes(planeDims(plane)), idx * FRAME_BYTES
            )
        ).buffer);
    }

    return <YUV>yuv;
}

export { read, YUV };
