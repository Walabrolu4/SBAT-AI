import Phaser from 'phaser'
import { ElevationMap } from './elevation_map';
import { mapNumber } from './utils';
//import {Vector2 , Vec2} from './vec2'

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;

export class Unit extends Phaser.GameObjects.Container {
  private image: Phaser.GameObjects.Image;
  private pos: Phaser.Math.Vector2;
  private name: string
  private morale: number;
  private curAmmo: number;
  private unitType: UnitType;
  private state: UnitState;
  private stateText: Phaser.GameObjects.Text;
  private stats: UnitStats;

  private targetPos?: Vector2;
  private elevationMap?: ElevationMap;
  private currentElevation: number;
  private movementLine: Phaser.GameObjects.Line | null = null;

  constructor(scene: Phaser.Scene, elevationMap: ElevationMap, unitName: string = "new unit", x: number = 0, y: number = 0, texture_key?: string, unitType: UnitType = UnitType.infantry) {
    super(scene, x, y);

    this.scene.add.existing(this);
    this.name = unitName

    this.pos = new Phaser.Math.Vector2(x, y);

    if (texture_key) {
      this.image = scene.add.image(0, 0, texture_key);
      this.add(this.image);
      this.setSize(this.image.width, this.image.height);
    } else { console.warn("unit " + this.name + "has been created with no image") };

    this.state = UnitState.idling;
    this.unitType = unitType;
    this.stats = UnitStatMap[this.unitType];
    this.curAmmo = this.stats.maxAmmo;
    this.morale = 100;

    this.elevationMap = elevationMap;
    this.currentElevation = this.elevationMap.getElevation(this.pos.x, this.pos.y);
    this.initializeStateText();

    this.setInteractive();

    console.log("Unit " + this.name + " has been created");
  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(x: number, y: number): this {
    super.setPosition(x, y); // Update the container's position
    if (this.pos) {
      this.pos.set(x, y);
    } else { console.log("Could not set internal position value :( "); }
    return this;
  }

  moveToLocation(target: Vector2): void {
    this.targetPos = target.clone();
    this.state = UnitState.moving;
  }

  preUpdate(time: number, delta: number): void {
    if (this.state !== UnitState.moving) return;
    if (!this.targetPos) console.error(`${this.name} wants to move but NO target location is set!?`);
    if (!this.elevationMap) console.error(`${this.name} wants to move but has no refrence to the elevation map!? WTF??`);

    const current = this.getPos();
    const direction = this.targetPos.clone().subtract(current);
    const distance = direction.length();
    this.updateStateText();

    if (distance < 1) {
      this.setPos(this.targetPos.x, this.targetPos.y);
      this.state = UnitState.idling;
      console.log("REACHED THE END!");
      this.targetPos = undefined;
      this.updateStateText();
      // Clear the line when reaching destination
      if (this.movementLine) {
        this.movementLine.destroy();
        this.movementLine = null;
      }

      return;
    }

    const baseSpeed = this.stats.speed;
    direction.normalize();

    const currentElevation = this.elevationMap.getElevation(current.x, current.y);
    const stepSize = 1;
    const step = direction.clone().scale(stepSize);
    const nextPos = current.clone().add(step);
    const nextElevation = this.elevationMap.getElevation(nextPos.x, nextPos.y);

    const slope = nextElevation - currentElevation;

    const speedMultiplier = mapNumber(Math.abs(slope), 0, 10, 1, 0.01);
    const effectiveSpeed = baseSpeed * speedMultiplier

    const moveDelta = direction.clone().scale(effectiveSpeed * delta * 0.01);
    const newPos = current.clone().add(moveDelta);
    this.setPos(newPos.x, newPos.y);

    if (this.movementLine) {
      this.movementLine.destroy();
    }

    this.movementLine = this.scene.add.line(
      0, 0,
      current.x, current.y,
      this.targetPos?.x, this.targetPos?.y,
      0xff0000, 1
    );
    this.movementLine.setOrigin(0, 0);
    this.movementLine.setLineWidth(2);
  }

  initializeStateText() {
    this.stateText = this.scene.add.text(this.pos.x, this.pos.y, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      //padding: { x: 4, y: 2 }
    });

  }
  updateStateText() {
    this.stateText.setPosition(this.pos.x - 25, this.pos.y - 30);
    this.stateText.setText(`${UnitState[this.state]}`);
  }
}


//---------------------------------------//

enum UnitState {
  idling,
  moving,
  attacking,
  defending,
  breaking
}

enum UnitType {
  hq,
  infantry,
  air,
  tank
}

interface UnitStats {
  maxHP: number;
  attack: number;
  speed: number;
  maxAmmo: number;
}

const UnitStatMap: Record<UnitType, UnitStats> = {
  [UnitType.hq]: { maxHP: 1000, attack: 0, speed: 0, maxAmmo: 0 },
  [UnitType.infantry]: { maxHP: 100, attack: 10, speed: 2, maxAmmo: 50 },
  [UnitType.air]: { maxHP: 200, attack: 20, speed: 4, maxAmmo: 25 },
  [UnitType.tank]: { maxHP: 500, attack: 50, speed: 1, maxAmmo: 5 }
};