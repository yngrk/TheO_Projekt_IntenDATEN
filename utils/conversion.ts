const scaleX = 0.00037768853390825804;
const scaleY = 0.00023159345813645644;
const transX = 5.8662505149842445;
const transY = 47.27012252807622;

export function lonLatToTopo(input: [number, number]): [number, number] {
    const resultX = Math.round((input[0] - transX) / scaleX);
    const resultY = Math.round((input[1] - transY) / scaleY);

    return [resultX, resultY]
}

export function topoToLonLat(input: [number, number]): [number, number] {
    const lon = input[0] * scaleX + transX;
    const lat = input[1] * scaleY + transY;

    return [lon, lat]
}