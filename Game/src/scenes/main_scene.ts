import { Map } from './../objects/map';
import { GridOverlay } from '../objects/grid_overlay';
import { Unit, UnitState, UnitType } from '../objects/unit';
import { MousePopup } from '../objects/mouse_popup';
import { ElevationMap } from '../objects/elevation_map';
import { DebugBox } from '../objects/debug';
import { UnitManager } from '../objects/unit_manager';
import { GameState } from '../objects/utils/game_state';
import { UnitData } from '../objects/utils/utils';
import { triggerLLMMove } from '../objects/utils/llm_move';

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;


export class MainScene extends Phaser.Scene {

  mousePopup !: MousePopup;
  private gameState: GameState;
  private elevationMap!: ElevationMap;
  private mapImage!: Map;
  private debugBox: DebugBox;
  private unitManager: UnitManager;

  private unitPosList: UnitData[];
  private elevationMapInfo: number[][];

  constructor() {
    // Assign a unique key to this Scene
    super({ key: 'MainScene' });
    console.log("MainScene Constructor ran from main_scene.ts");
  }

  preload() {
    this.load.image('backgroundImage', 'assets/map_3.png');
    this.load.image('heightImage', 'assets/heightmap_3.png');
    this.load.image('unit_infantry', 'assets/units/infantry.png');
  }

  create() {
    (window as any).mainScene = this;

    this.input.mouse.disableContextMenu();
    console.log('MainScene created!');

    const gameWidth = this.sys.game.config.width as number;
    const gameHeight = this.sys.game.config.height as number;

    //Setup Maps
    this.mapImage = new Map(this, 0, 0, 'backgroundImage');
    this.elevationMap = new ElevationMap(this, 0, 0, 'heightImage');

    const imageSize = 1280;
    const cols = 16;
    const rows = 16;

    // Visual overlay
    const overlay = new GridOverlay(this, cols, rows, imageSize, imageSize);
    overlay.setPosition(0, 0);

    //Debug and mouse popup
    this.debugBox = new DebugBox(this);
    this.mousePopup = new MousePopup(this);

    //Setup Unit Manager
    this.unitManager = new UnitManager(this);

    //Test unit for testing
    const testUnit = new Unit(this, this.elevationMap, "test infantry", 50, 50, 'unit_infantry');
    console.log(testUnit.estimateFuelUsageTo(new Vector2(500, 300)));
    //testUnit.moveToLocation(new Vector2(500,300));
    this.unitManager.addUnit(testUnit);

    const testUnit2 = new Unit(this, this.elevationMap, "test infantry", 60, 50, 'unit_infantry');
    //testUnit2.moveToLocation(new Vector2(200,500));
    this.unitManager.addUnit(testUnit2);
    console.log("Everything is initalized!");


    //GameStateManager
    this.gameState = new GameState(this);
    this.elevationMapInfo = this.gameState.getElevationData(this.elevationMap, /*gameWidth, gameHeight*/);
    this.unitPosList = this.gameState.getAllUnitData(this.unitManager.getAllUnits());
    console.log('MainScene instance:', (window as any).mainScene);


    triggerLLMMove(this);
    //this.time.delayedCall(7000, () => {
    //  triggerLLMMove();
    //}, [], this);
  }


  update(time: number, delta: number) {
    this.mousePopup.update(this.elevationMap);
    this.debugBox.setText(`Time: ${time.toFixed(0)}\nDelta: ${delta.toFixed(2)}`);
  }

  public getElevationMapInfo(): number[][] {
    return this.elevationMapInfo;
  }

  public getUnitPosList(): UnitData[] {
    return this.unitPosList;
  }

  public getUnitManager(): UnitManager {
    return this.unitManager;
  }
}
