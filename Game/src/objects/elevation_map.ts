import Phaser, { NONE } from 'phaser'
import { mapNumber } from './utils/utils';

export class ElevationMap extends Phaser.GameObjects.Image {
  key !: string ;
  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key);
    this.key = key;
    scene.add.existing(this);
    this.setOrigin(0, 0);
    this.setVisible(false);
  }

  public getElevation(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -99;

    const textureManager = this.scene.textures;
    const pixel = textureManager.getPixel(x,y,this.key);

    if (!pixel){
      return -99;
    }

    let height: number = mapNumber(pixel.red,0,255,-10,10);
    height = Math.floor(height);
    return height;
  }

  public createCostSummaryMap(chunkSize: number): number[][] {
    if (chunkSize <= 0) {
      throw new Error('Chunk size must be a positive number.');
    }

    const summaryMapWidth = Math.ceil(this.width / chunkSize);
    const summaryMapHeight = Math.ceil(this.height / chunkSize);
    const summaryMap: number[][] = Array.from({ length: summaryMapHeight }, () => Array(summaryMapWidth).fill(0));

    for (let summaryY = 0; summaryY < summaryMapHeight; summaryY++) {
      for (let summaryX = 0; summaryX < summaryMapWidth; summaryX++) {
        const startX = summaryX * chunkSize;
        const startY = summaryY * chunkSize;
        const endX = Math.min(startX + chunkSize, this.width);
        const endY = Math.min(startY + chunkSize, this.height);

        const heightsInChunk: number[] = [];
        // Loop through each pixel within the chunk
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            // *** FIX: Use the getElevation method to read height data ***
            const elevation = this.getElevation(x, y);
            // You may want to ignore invalid elevation values
            if (elevation !== -99) {
                heightsInChunk.push(elevation);
            }
          }
        }

        if (heightsInChunk.length === 0) {
          continue; // No valid data in this chunk
        }

        // 1. Calculate the mean height of the chunk
        const mean = heightsInChunk.reduce((acc, val) => acc + val, 0) / heightsInChunk.length;

        // 2. Calculate the variance
        const variance = heightsInChunk.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / heightsInChunk.length;

        // 3. Use the standard deviation as the "cost"
        const standardDeviation = Math.sqrt(variance);
        
        summaryMap[summaryY][summaryX] = standardDeviation;
      }
    }

    return summaryMap;
  }
}