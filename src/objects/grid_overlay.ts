import Phaser from 'phaser'
export class GridOverlay extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    public cols: number,
    public rows: number,
    public width: number,
    public height: number
  ) {
    super(scene);
    scene.add.existing(this);

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.3);

    // Draw grid lines
    for (let x = 0; x <= cols; x++) {
      graphics.lineBetween(x * cellWidth, 0, x * cellWidth, height);
    }
    for (let y = 0; y <= rows; y++) {
      graphics.lineBetween(0, y * cellHeight, width, y * cellHeight);
    }

    this.add(graphics);
  }
}