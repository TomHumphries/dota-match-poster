import { CanvasRenderingContext2D, createCanvas, loadImage } from 'canvas';
import { isRadiant } from '../match-logic';
import { WardEvent } from './WardEvent';
import { LinearTransformer } from './LinearTransformer';

export class WardMapper {
    constructor(
        private readonly mapFilepath: string,
        private readonly xTransformer: LinearTransformer,
        private readonly yTransformer: LinearTransformer,
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

        // this.addGrid(ctx, image);
        
        const observers = wards.filter(ward => ward.wardType == 'OBSERVER');

        // Draw wards on the map
        this.addWardDots(ctx, wards, image);
        this.addWardCoordinates(ctx, wards, image);

        return canvas.toBuffer();
    }

    private addWardDots(ctx: CanvasRenderingContext2D, wards: WardEvent[], image: {width: number, height: number}) {

        wards.forEach(ward => {
            // const { x, y } = this.rescaleCoordinates(ward, image);
            const x = this.xTransformer.transform(ward.positionX);
            const y = this.yTransformer.transform(ward.positionY);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2, true); // Draw a 2px circle
            ctx.fillStyle = isRadiant(ward.fromPlayer) ? '#20c997' : '#ff0000';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        });
    }

    private addWardCoordinates(ctx: CanvasRenderingContext2D, wards: WardEvent[], image: {width: number, height: number}) {

        wards.forEach(ward => {
            // const { x, y } = this.rescaleCoordinates(ward, image);
            const x = this.xTransformer.transform(ward.positionX);
            const y = this.yTransformer.transform(ward.positionY);
            ctx.fillStyle = ward.wardType == 'OBSERVER' ? 'yellow' : 'blue';
            ctx.font = '10px Arial';
            ctx.fillText(`(${ward.positionX}, ${ward.positionY})`, x + 5, y + 5);
        });
    }

    private addGrid(ctx: CanvasRenderingContext2D, image: {width: number, height: number}) {
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
    }
}