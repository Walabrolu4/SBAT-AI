export class DebugBox extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.text = new Phaser.GameObjects.Text(scene, 10, 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    this.add(this.text);
    scene.add.existing(this);


    scene.input.keyboard?.on('keydown-T',() => this.toggleVisibility(this));
  }

  setText(message:string){
    this.text.setText(message);
  }

  toggleVisibility(self:DebugBox){
    console.log("poo");
    self.visible = !self.visible;
  }
}