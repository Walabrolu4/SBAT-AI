import { ElevationMap } from "./elevation_map";
export class MousePopup extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;
  private shiftKey;
  private display: boolean = false;
  width:number = 0;
  height:number = 0;
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

    this.width = scene.sys.game.config.width as number;
    this.height = scene.sys.game.config.height as number;
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
      const y = Math.floor(pointer.worldY);
      let offsetX = 10;
      let offsetY = 10;
      const elevation = elevationMap.getElevation(x,y);
      this.text.setText(`X: ${x}\nY: ${y}\nE: ${elevation}`);
      if (x > this.width + 10){
        //console.log("triggerX!");
        offsetX = -100;
      }
      if(y < this.height + 10){
        //console.log("triggerX!");
        offsetY = -10
      }
      //this.setPosition(x + offsetX, y + offsetY);
      this.setPosition(100,100);
    }
    else{
      this.text.visible = false;
    }
  }
}