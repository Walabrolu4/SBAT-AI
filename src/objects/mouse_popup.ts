import { ElevationMap } from "./elevation_map";
export class MousePopup extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;
  private shiftKey;
  private display: boolean = false;

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

    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.shiftKey.on('down',()=>this.displayOn());
    this.shiftKey.on('up',()=>this.displayOff());
  }

  displayOn(){
    console.log("toolTip On");
    this.display = true;
  }
  displayOff(){
    console.log("toolTip Off");
    this.display = false;
  }

  update(elevationMap:ElevationMap){
    if(this.display)
    {
      this.text.visible = true;
      const pointer = this.scene.input.activePointer;
      const x = pointer.worldX;
      const y = pointer.worldY;
      const elevation = elevationMap.getElevation(x,y);
      this.text.setText(`X: ${x}\nY: ${y}\nE: ${elevation}`);
      this.setPosition(pointer.worldX + 10, pointer.worldY + 10);
    }
    else{
      this.text.visible = false;
    }
  }
}