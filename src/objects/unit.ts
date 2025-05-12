import Phaser from "phaser";
import { ElevationMap } from "./elevation_map";
import { mapNumber } from "./utils/utils";
//import {Vector2 , Vec2} from './vec2'

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;

export class Unit extends Phaser.GameObjects.Container {
  // CLASS DATA //
  private image: Phaser.GameObjects.Image;
  private name: string;
  private unitType: UnitType;

  private pos: Phaser.Math.Vector2;
  private id:number = 0;
  private state: UnitState;
  private stateText: Phaser.GameObjects.Text;
  private stats: UnitStats;
  private currentFuel: number;
  private targetPos?: Vector2;
  private movementQueue: Vector2[] = [];
  private elevationMap?: ElevationMap;
  private currentElevation: number;
  private movementLine: Phaser.GameObjects.Graphics | null = null;
  private border: Phaser.GameObjects.Graphics | null = null;

  constructor(
    scene: Phaser.Scene,
    elevationMap: ElevationMap,
    unitName: string = "new unit",
    x: number = 0,
    y: number = 0,
    texture_key?: string,
    unitType: UnitType = UnitType.infantry
  ) {
    super(scene, x, y);

    //Basic Initalization
    this.scene.add.existing(this);

    //Add image
    this.name = unitName;
    if (texture_key) {
      this.image = scene.add.image(0, 0, texture_key);
      this.add(this.image);
      this.setSize(this.image.width, this.image.height);
    } else {
      console.warn("unit " + this.name + "has been created with no image");
    }

    //Set basic Variables
    this.pos = new Phaser.Math.Vector2(x, y);
    this.state = UnitState.idling;
    this.unitType = unitType;
    this.stats = UnitStatMap[this.unitType];
    this.currentFuel = this.stats.fuel;

    this.elevationMap = elevationMap;
    this.currentElevation = this.elevationMap.getElevation(
      this.pos.x,
      this.pos.y
    );

    this.initializeStateText();
    this.updateStateText();
    this.setInteractive();

    console.log("Unit " + this.name + " has been created");
  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(x: number, y: number): this {
    super.setPosition(x, y);
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      console.log("Could not set internal position value :( ");
    }
    return this;
  }

  public getId():number{
    return this.id;
  }
  public setId(id :number){
    this.id = id;
  }

  queueMoveToLocation(target: Vector2, clearQueue: boolean = false): void {
    if (clearQueue) {
      this.movementQueue = [];
    }
    this.movementQueue.push(target.clone());
    console.log(`${this.name} is queing a move to (${target.x},${target.y})`);
    if (this.state !== UnitState.moving || clearQueue) {
      this.startNextMove();
    }
  }

  private startNextMove(): void {
    if (this.movementQueue.length == 0) {
      this.state = UnitState.idling;
      this.targetPos = undefined;
      if (this.movementLine) {
        this.movementLine?.destroy();
        this.movementLine = null;
      }
      return;
    }

    this.targetPos = this.movementQueue.shift();
    this.state = UnitState.moving;
    console.log(
      `${this.name} is moving to (${this.targetPos.x},${this.targetPos.y})`
    );
  }

  moveToLocation(target: Vector2): void {
    console.log(`${this.name} is moving to ${target}`);
    this.targetPos = target.clone();
    this.state = UnitState.moving;
  }

  preUpdate(time: number, delta: number): void {
    //Handle move state
    if (this.state == UnitState.moving) {
      this.handleMoveState(time, delta);
    } else {
      return;
    }
  }

  handleMoveState(time: number, delta: number) {
    if (this.state !== UnitState.moving) return;
    if (!this.targetPos)
      console.error(
        `${this.name} wants to move but NO target location is set!?`
      );
    if (!this.elevationMap)
      console.error(
        `${this.name} wants to move but has no refrence to the elevation map!? WTF??`
      );

    //Calculate some basic variables
    const current = this.getPos();
    const direction = this.targetPos.clone().subtract(current);
    const distance = direction.length();
    const baseFuelConsumption = 0.1;

    this.updateStateText();

    //Go back to idle if we are close enough to the pos and "teleport" us there
    if (distance < 1) {
      this.setPos(this.targetPos.x, this.targetPos.y);
      console.log(`${this.name} reached waypoint`);
      this.startNextMove();
      this.updateStateText();
      return;
    }

    //Calculate the elevation based speed to take.
    const baseSpeed = this.stats.speed;
    direction.normalize();

    const currentElevation = this.elevationMap.getElevation(
      current.x,
      current.y
    );
    const stepSize = 1;
    const step = direction.clone().scale(stepSize);
    const nextPos = current.clone().add(step);
    const nextElevation = this.elevationMap.getElevation(nextPos.x, nextPos.y);

    const slope = nextElevation - currentElevation;
    const slopeFactor = 1 + Math.abs(slope) * 0.2;

    const speedMultiplier = mapNumber(Math.abs(slope), 0, 10, 1, 0.01);
    const effectiveSpeed = baseSpeed * speedMultiplier;

    //Calc new position and move us there
    const moveDelta = direction.clone().scale(effectiveSpeed * delta * 0.01);
    const fuelConsumption =
      baseFuelConsumption * moveDelta.length() * slopeFactor;
    this.currentFuel -= fuelConsumption;

    const newPos = current.clone().add(moveDelta);
    this.setPos(newPos.x, newPos.y);

    if (this.currentFuel <= 0) {
      this.currentFuel = 0;
      this.state = UnitState.idling;
      this.targetPos = undefined;
      console.log(`${this.name} has run out of fuel!!`);

      this.movementQueue = [];
      if (this.movementLine) {
        this.movementLine.destroy();
        this.movementLine = null;
      }
    }
    //Draw a line to show the movement
    this.drawMovementPath();
  }

  drawMovementPath(): void {
    //clear old path
    if (this.movementLine) {
      this.movementLine.destroy();
      this.movementLine = null;
    }

    if (
      !this.targetPos &&
      (!this.movementQueue || this.movementQueue.length === 0)
    )
      return;

    //create new graphics object
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xff0000, 1);

    //Start new path
    graphics.beginPath();
    graphics.moveTo(0, 0);

    //draw for each queued point
    if (this.targetPos) {
      graphics.lineTo(this.targetPos.x - this.x, this.targetPos.y - this.y);
    }
    for (const point of this.movementQueue) {
      graphics.lineTo(point.x - this.x, point.y - this.y);
    }

    graphics.strokePath();
    graphics.closePath();

    this.add(graphics);

    this.movementLine = graphics;
  }

  public highlight(highlight: boolean) {
    if (highlight) {
      if (this.border) {
        this.border.destroy();
      }

      this.border = this.scene.add.graphics();
      this.border.lineStyle(2, 0xffff00);
      this.border.strokeRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      this.add(this.border);
      this.bringToTop(this.border);
    } else {
      if (this.border) {
        this.border.destroy();
        this.border = null;
      }
    }
  }
  //Handle the displaying of the "state text"
  initializeStateText() {
    this.stateText = this.scene.add.text(this.pos.x, this.pos.y, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000",
    });
  }
  updateStateText() {
    this.stateText.setPosition(this.pos.x - 25, this.pos.y - 30);
    this.stateText.setText(
      `${UnitState[this.state]} \nfuel:${Math.floor(this.currentFuel)}`
    );
  }

  public getName(): string {
    return this.name;
  }

  public getFuel(): number {
    return this.currentFuel;
  }

  estimateFuelUsageTo(target: Vector2): number {
    if (!this.elevationMap) {
      console.warn(`${this.name} has no elevation map!`);
      return 0;
    }

    const current = this.getPos().clone();
    const direction = target.clone().subtract(current);
    const distance = direction.length();

    if (distance === 0) return 0;

    direction.normalize();
    const baseFuelConsumption = 0.1;
    const baseSpeed = this.stats.speed;

    let totalFuel = 0;
    let steps = Math.ceil(distance); // simulate in 1px steps
    let simPos = current.clone();

    for (let i = 0; i < steps; i++) {
      const nextPos = simPos.clone().add(direction);
      const currentElevation = this.elevationMap.getElevation(
        simPos.x,
        simPos.y
      );
      const nextElevation = this.elevationMap.getElevation(
        nextPos.x,
        nextPos.y
      );

      const slope = nextElevation - currentElevation;
      const slopeFactor = 1 + Math.abs(slope) * 0.2;

      const speedMultiplier = mapNumber(Math.abs(slope), 0, 10, 1, 0.01);
      const effectiveSpeed = baseSpeed * speedMultiplier;

      const moveDistance = 1; // simulating per-pixel
      const moveDelta = direction.clone().scale(moveDistance);

      const fuelUsed = baseFuelConsumption * moveDelta.length() * slopeFactor;
      totalFuel += fuelUsed;

      simPos.add(moveDelta);
    }

    return totalFuel;
  }
}

//---------------------------------------//

enum UnitState {
  idling,
  outOfFuel,
  moving,
  attacking,
  defending,
  breaking,
}

enum UnitType {
  hq,
  infantry,
  air,
  tank,
}

interface UnitStats {
  maxHP: number;
  speed: number;
  fuel: number;
}

interface unitBasicInfo {
  name: string;
  pos: Vector2;
  fuel: number;
}

const UnitStatMap: Record<UnitType, UnitStats> = {
  [UnitType.hq]: { maxHP: 1000, speed: 0, fuel: 0 },
  [UnitType.infantry]: { maxHP: 100, speed: 1, fuel: 100 },
  [UnitType.air]: { maxHP: 200, speed: 3, fuel: 80 },
  [UnitType.tank]: { maxHP: 500, speed: 0.3, fuel: 180 },
};
