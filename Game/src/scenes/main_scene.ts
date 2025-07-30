import { Map } from "./../objects/map";
import { GridOverlay } from "../objects/grid_overlay";
import { Unit, UnitState, UnitType } from "../objects/unit";
import { MousePopup } from "../objects/mouse_popup";
import { ElevationMap } from "../objects/elevation_map";
import { DebugBox } from "../objects/debug";
import { UnitManager } from "../objects/unit_manager";
import { GameState } from "../objects/utils/game_state";
import { UnitData } from "../objects/utils/utils";
import { triggerLLMMove } from "../objects/utils/llm_move";
import { findBestPath } from "../objects/utils/fuel_optimizer";
import { findFuelOptimalPath } from "../objects/utils/fuel_pathfinder";

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;

export class MainScene extends Phaser.Scene {
  mousePopup!: MousePopup;
  private gameState: GameState;
  private elevationMap!: ElevationMap;
  private mapImage!: Map;
  private debugBox: DebugBox;
  private unitManager: UnitManager;

  private unitPosList: UnitData[];
  private elevationMapInfo: number[][];

  constructor() {
    // Assign a unique key to this Scene
    super({ key: "MainScene" });
    console.log("MainScene Constructor ran from main_scene.ts");
  }

  preload() {
    this.load.image("backgroundImage", "assets/map.png");
    this.load.image("heightImage", "assets/heightmap.png");
    this.load.image("unit_infantry", "assets/units/infantry.png");
  }

  create() {
    (window as any).mainScene = this;

    this.input.mouse.disableContextMenu();
    console.log("MainScene created!");

    const gameWidth = this.sys.game.config.width as number;
    const gameHeight = this.sys.game.config.height as number;

    //Setup Maps
    this.mapImage = new Map(this, 0, 0, "backgroundImage");
    this.elevationMap = new ElevationMap(this, 0, 0, "heightImage");

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
    const testUnit = new Unit(
      this,
      this.elevationMap,
      "test infantry",
      50,
      50,
      "unit_infantry"
    );
    console.log(testUnit.estimateFuelUsageTo(new Vector2(500, 300)));
    //testUnit.moveToLocation(new Vector2(500,300));
    this.unitManager.addUnit(testUnit);

    const testUnit2 = new Unit(
      this,
      this.elevationMap,
      "test infantry",
      60,
      50,
      "unit_infantry"
    );
    //testUnit2.moveToLocation(new Vector2(200,500));
    this.unitManager.addUnit(testUnit2);
    console.log("Everything is initalized!");

    //GameStateManager
    this.gameState = new GameState(this);
    this.elevationMapInfo = this.gameState.getElevationData(
      this.elevationMap /*gameWidth, gameHeight*/
    );
    this.unitPosList = this.gameState.getAllUnitData(
      this.unitManager.getAllUnits()
    );
    console.log("MainScene instance:", (window as any).mainScene);

    const chunkSize = 10;
    const strategicMap = this.elevationMap.createCostSummaryMap(chunkSize);
    console.log("STRATEGIC");
    console.log(strategicMap.length);
    console.log(strategicMap);

    /* TESTING PATHFINDING
    const unitManager = this.unitManager;
    const elevationMap = this.elevationMap;
    if (!unitManager || !elevationMap) {
      console.error("Missing unit manager or elevation map");
      return;
    }

    const unit = unitManager.getUnitById(0);
    if (!unit) {
      console.error("Unit 0 not found");
      return;
    }

    const start = unit.getPos();
    const goal = new Phaser.Math.Vector2(436, 523);

    const path = findFuelOptimalPath(elevationMap, start, goal, unit);

    console.log("🧭 Path found:", path);

    this.moveUnitAlongPath(unit, path);
    */

    //EVERT LISTENER FOR TEXT BOX
    const input = document.getElementById("llm-input") as HTMLInputElement;
    const submit = document.getElementById("llm-submit") as HTMLButtonElement;
    submit.addEventListener("click", async () => {
      const instruction = input.value;
      console.log("🧠 Instruction sent to LLM:", instruction);

      const response = await fetch("https://e729ff608787.ngrok-free.app/llm/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruction,
          gameState: {}, // Optional: can add unit info here later
          availableActions: [], // Optional
        }),
      });

      const data = await response.json();
      console.log("🤖 LLM response:", data);

      const unitId = data.unitId;
      const goal = new Phaser.Math.Vector2(data.x, data.y);

      const unit = this.getUnitManager().getUnitById(unitId);
      if (!unit) return console.warn("❌ Unit not found");

      const start = unit.getPos();
      const path = findFuelOptimalPath(
        this.getElevationMap(),
        start,
        goal,
        unit
      );

      this.moveUnitAlongPath(unit, path); // You may already have this function
    });
  }

  moveUnitAlongPath(unit: Unit, path: Phaser.Math.Vector2[]) {
    for (let i = 0; i < path.length; i++) {
      unit.queueMoveToLocation(path[i]);
    }
  }

  update(time: number, delta: number) {
    this.mousePopup.update(this.elevationMap);
    this.debugBox.setText(
      `Time: ${time.toFixed(0)}\nDelta: ${delta.toFixed(2)}`
    );
  }

  public getElevationMapInfo(): number[][] {
    return this.elevationMapInfo;
  }
  public getElevationMapSummary(chunkSize: number): number[][] {
    return this.elevationMap.createCostSummaryMap(chunkSize);
  }

  public getUnitPosList(): UnitData[] {
    return this.unitPosList;
  }

  public getUnitManager(): UnitManager {
    return this.unitManager;
  }

  public getElevationMap(): ElevationMap {
    return this.elevationMap;
  }
}

export function triggerLocalOptimalMove(mainScene: MainScene) {
  const unitManager = mainScene.getUnitManager();
  const units = unitManager.getAllUnits();
  const elevationMap = mainScene.getElevationMap();
  const target = new Phaser.Math.Vector2(450, 541);

  for (const unit of units) {
    if (unit != units[0]) {
      continue;
    }
    const start = unit.getPos();
    const path = findFuelOptimalPath(elevationMap, start, target, unit);

    for (let i = 0; i < path.length; i++) {
      unit.queueMoveToLocation(path[i], i === 0); // Clear queue only on first
    }
    console.log(
      `🚀 Starting path from (${start.x}, ${start.y}) to (${target.x}, ${target.y})`
    );
    console.log(
      `🧮 Optimal path for ${unit.getName()}:`,
      path.map((p) => `(${p.x},${p.y})`).join(" -> ")
    );
  }
}
