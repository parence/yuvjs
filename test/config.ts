const base_path = './test/data/';
export const test_o_path = base_path + 'output/';

export const files = {
    ducks_420: {
        path: base_path + 'ducks_take_off_420_720p50.yuv',
        format: '420',
        dimensions: { width: 1280, height: 720 },
        bits: 8,
        frames: 500
    },
    stars_420: {
        path: base_path + 'stars_420.yuv',
        format: '420',
        dimensions: { width: 1920, height: 1080 },
        bits: 8,
        frames: 55
    },
    stars_444: {
        path: base_path + 'stars_444.yuv',
        format: '444',
        dimensions: { width: 1920, height: 1080 },
        bits: 8,
        frames: 55
    }
};