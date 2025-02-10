/**
 * Maps a value from one range to another using a linear transformation
 */
export class LinearTransformer {
    private m: number;
    private c: number;
    constructor(
        point0: {original: number; transformed: number},
        point1: {original: number; transformed: number},
    ) {
        // calculate the slope and intercept of the line
        // y = mx + c
        // m = (y1 - y0) / (x1 - x0)
        // c = y0 - m * x0
        this.m = (point1.transformed - point0.transformed) / (point1.original - point0.original);
        this.c = point0.transformed - this.m * point0.original;
    }

    public transform(value: number): number {
        return this.m * value + this.c;
    }
}