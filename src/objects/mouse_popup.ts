import { ElevationMap } from "./elevation_map";
export class MousePopup extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.text = scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });


    this.add(this.text);
    this.setDepth(1000);
    scene.add.existing(this);

  }

  update(elevationMap:ElevationMap){
    const pointer = this.scene.input.activePointer;
    const x = pointer.worldX;//.toFixed(0);
    const y = pointer.worldY;//.toFixed(0);
    const elevation = elevationMap.getElevation(x,y);
    this.text.setText(`X: ${x}\nY: ${y}\n E: ${elevation}`);
    this.setPosition(pointer.worldX + 10, pointer.worldY + 10);
  }
}