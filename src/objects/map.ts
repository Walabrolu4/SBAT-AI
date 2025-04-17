import Phaser from 'phaser'
 
export class Map extends Phaser.GameObjects.Image{

  constructor(scene: Phaser.Scene, x:number,y:number,key:string){
    super(scene,x,y,key);

    scene.add.existing(this);
    this.setOrigin(0,0);
  }
}