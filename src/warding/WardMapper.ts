import { createCanvas, loadImage } from 'canvas';
import { isRadiant } from '../match-logic';
import { WardEvent } from './WardEvent';

export class WardMapper {
    constructor(
        private readonly mapFilepath: string,
    ) {}

    public async buildMap(wards: WardEvent[]): Promise<Buffer> {
        const image = await loadImage(this.mapFilepath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the map image on the canvas
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Draw semi-transparent grid 128 x 128 over the image
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 128; i++) {
            const x = (i / 128) * image.width;
            const y = (i / 128) * image.height;

            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, image.height);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(image.width, y);
            ctx.stroke();
        }

        const observers = wards.filter(ward => ward.wardType == 'OBSERVER');

        // Draw wards on the map
        observers.forEach(ward => {
            const { x, y } = this.rescaleCoordinates(ward, image);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2, true); // Draw a 2px circle
            ctx.fillStyle = isRadiant(ward.fromPlayer) ? '#20c997' : '#ff0000';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        });

        return canvas.toBuffer();
    }

    /**
     * The coordinates only use the middle of the 256-step coordinate space between 64 and 192.  
     * This rescales them to the 0 - 1 space.  
     */
    private normalisePaddedCoordinates(x: number, y: number) {
        const MAX_COORD = 255;
        const HALF_COORD = MAX_COORD / 2;
        const QUARTER_COORD = MAX_COORD / 4;
        const newX = (x - QUARTER_COORD) / HALF_COORD;
        const newY = (HALF_COORD - (y - QUARTER_COORD)) / HALF_COORD;
        return {
            x: newX,
            y: newY,
        }
    }

    private rescaleCoordinates(coord: {positionX: number, positionY: number}, image: {width: number, height: number}): { x: number, y: number } {
        const normalised = this.normalisePaddedCoordinates(coord.positionX, coord.positionY);
        const rescaledX = normalised.x * image.width;
        const rescaledY = normalised.y * image.height;

        return { x: rescaledX, y: rescaledY };
    }
}