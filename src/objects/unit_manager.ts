import Phaser from "phaser";
import { Unit } from "./unit";

export class UnitManager {
  private units: Unit[] = [];
  private selectedUnit: Unit | null = null;
  private shiftKey;
  private shiftMod:boolean = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if(pointer.rightButtonDown()){
        this.handleUnitMove(pointer)
      }
      else{
        this.handleUnitSelection(pointer);
      }

      this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.shiftKey.on('down',()=>this.shiftDown());
      this.shiftKey.on('up',()=>this.shiftUp());
    });
  }
  shiftUp() {
    this.shiftMod = false;
  }
  shiftDown() {
    this.shiftMod = true;
  }

  private handleUnitSelection(pointer: Phaser.Input.Pointer): void {
    for (const unit of this.units) {
      if (unit.getBounds().contains(pointer.x, pointer.y)) {
        this.selectUnit(unit);
        console.log(`Selected unit: ${unit.getName()}`)
        this.deselectAll();
        return;
      }
    }
    if(this.selectedUnit){
      console.log(`deselecting unit ${this.selectedUnit.getName()}`);
      this.selectedUnit.highlight(false);
      this.selectedUnit = null;
    }
  }

  private deselectAll(){
    for (const unit of this.units){
      if(unit == this.selectedUnit){
        continue;
      }
      unit.highlight(false);
    }
  }

  private selectUnit(unit : Unit){
    this.selectedUnit = unit;
    this.selectedUnit.highlight(true);
  }
  private handleUnitMove(pointer: Phaser.Input.Pointer): void{
    if (!this.selectedUnit) {return;}

    const moveLoc: Phaser.Math.Vector2 = new Phaser.Math.Vector2(pointer.x,pointer.y);
    this.selectedUnit.queueMoveToLocation(moveLoc, !this.shiftMod);
  }

  addUnit(unit : Unit){
    this.units.push(unit);
  }

  public getAllUnits(): Unit[] {
    return this.units;
  }
}
