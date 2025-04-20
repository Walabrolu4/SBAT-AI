import Phaser from 'phaser'
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
}