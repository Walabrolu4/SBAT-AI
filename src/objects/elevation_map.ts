import Phaser from 'phaser'

export class ElevationMap{
  private ctx: CanvasRenderingContext2D;
  private height:number;
  private width:number;

  constructor(heightmapTexture: HTMLImageElement){
    this.width = heightmapTexture.width;
    this.height = heightmapTexture.height;

    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.drawImage(heightmapTexture, 0, 0);
  }

  public getElevation(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;

    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    const gray = pixel[0] / 255; // R=G=B in grayscale
    const elevation = (gray - 0.5) * 20; // Maps 0 to -10, 0.5 to 0, 1 to 10
    return elevation;
  }
}