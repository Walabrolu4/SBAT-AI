import Phaser from 'phaser'
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
  private stats: UnitStats;

  constructor(scene: Phaser.Scene, unitName: string = "new unit", x: number = 0, y: number = 0, texture_key?: string, unitType: UnitType = UnitType.infantry) {
    super(scene, x, y);

    this.scene.add.existing(this);
    this.name = unitName

    this.pos = new Phaser.Math.Vector2(x, y);

    if (texture_key) {
      this.image = scene.add.image(0,0,texture_key);
      this.add(this.image);
      this.setSize(this.image.width, this.image.height);
    } else { console.warn("unit " + this.name + "has been created with no image") };

    this.state = UnitState.idling;
    this.unitType = unitType;
    this.stats = UnitStatMap[this.unitType];
    this.curAmmo = this.stats.maxAmmo;
    this.morale = 100;
    this.setInteractive();

    console.log("Unit " + this.name + " has been created");
    //console.log("Vector2 methods:", Object.getOwnPropertyNames(Phaser.Math.Vector2.prototype));

  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(x: number, y: number): this {
    super.setPosition(x, y); // Update the container's position
    if(this.pos){
      this.pos.set(x,y);
    }else {console.log("Could not set internal position value :( ");}
    return this;
  }

}

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