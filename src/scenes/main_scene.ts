import { Map } from './../objects/map';
import { GridOverlay } from '../objects/grid_overlay';
import { Unit, UnitState, UnitType } from '../objects/unit';
import { MousePopup } from '../objects/mouse_popup';
import {ElevationMap} from '../objects/elevation_map';

export class MainScene extends Phaser.Scene {

  debugText !: Phaser.GameObjects.Text;
  mousePopup !: MousePopup;
  private elevationMap!: ElevationMap;
  private mapImage!: Map;

  constructor() {
    // Assign a unique key to this Scene
    super({ key: 'MainScene' });
    console.log("MainScene Constructor ran from main_scene.ts");
  }

  preload() {
    this.load.image('backgroundImage', 'assets/map.png');
    this.load.image('heightImage','assets/heightmap.png');
    this.load.image('unit_infantry', 'assets/units/infantry.png');
  }

  create() {

    console.log('MainScene created!');

    const gameWidth = this.sys.game.config.width as number;
    const gameHeight = this.sys.game.config.height as number;

    this.mapImage = new Map(this, 0, 0, 'backgroundImage');

    const heightmapImage = this.textures.get('heightmap').getSourceImage() as HTMLImageElement;
    this.elevationMap = new ElevationMap(heightmapImage);
    this.add.image(0,0,'heightImage');

    this.mousePopup = new MousePopup(this);

    const imageSize = 1280;
    const cols = 16;
    const rows = 16;

    // Visual overlay
    const overlay = new GridOverlay(this, cols, rows, imageSize, imageSize);
    overlay.setPosition(0, 0);
    const testUnit = new Unit(this, "test infantry", 100, 100, 'unit_infantry');


    this.debugText = this.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000'
    });

    console.log("Everything is initalized!");
  }


  update(time:number,delta:number) {
    this.mousePopup.update(this.elevationMap);
    this.debugText.setText(`Time: ${time.toFixed(0)}\nDelta: ${delta.toFixed(2)}`);
  }
}
