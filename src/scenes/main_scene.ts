import { Map } from './../objects/map';
import { GridOverlay } from '../objects/grid_overlay';
import { Unit, UnitState, UnitType } from '../objects/unit';
import { MousePopup } from '../objects/mouse_popup';
import {ElevationMap} from '../objects/elevation_map';
import { DebugBox } from '../objects/debug';

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;


export class MainScene extends Phaser.Scene {

  mousePopup !: MousePopup;
  private elevationMap!: ElevationMap;
  private mapImage!: Map;
  private debugBox: DebugBox;

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

    //const gameWidth = this.sys.game.config.width as number;
    //const gameHeight = this.sys.game.config.height as number;

    //Setup Maps
    this.mapImage = new Map(this, 0, 0, 'backgroundImage');
    this.elevationMap = new ElevationMap(this,0,0,'heightImage');

    const imageSize = 1280;
    const cols = 16;
    const rows = 16;

    // Visual overlay
    const overlay = new GridOverlay(this, cols, rows, imageSize, imageSize);
    overlay.setPosition(0, 0);

    //Debug and mouse popup
    this.debugBox = new DebugBox(this);
    this.mousePopup = new MousePopup(this);

    //Test unit for testing
    const testUnit = new Unit(this, this.elevationMap, "test infantry", 0, 0, 'unit_infantry');
    testUnit.moveToLocation(new Vector2(500,300));

    console.log("Everything is initalized!");
  }


  update(time:number,delta:number) {
    this.mousePopup.update(this.elevationMap);
    this.debugBox.setText(`Time: ${time.toFixed(0)}\nDelta: ${delta.toFixed(2)}`);
  }
}
