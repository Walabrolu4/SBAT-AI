import Phaser from "phaser";
import { ElevationMap } from "../elevation_map";
import { Unit } from "../unit";
import { UnitPos } from "./utils";
export class GameState {
  scene: Phaser.Scene;
  elevationMapInfo: number[][] = [];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public getAllUnitData(units:Unit[]){
    let unitPositions: UnitPos[]  = [];
    units.forEach(unit => {
      let pos = unit.getPos();
      let name = unit.getName();
      let fuel = unit.getFuel();
      let id = unit.getId();
      unitPositions.push({
        unitId: id,
        unitName: name,
        position: pos.clone(),
        currentFuel: fuel,
      })
    });
    //console.log(unitPositions);
    return unitPositions;
  }

  public getElevationData(map: ElevationMap, width: number, height: number) {
    for(let h =0 ; h<height; h++){
      this.elevationMapInfo[h] = [];
      for(let w=0; w<width; w++){
        this.elevationMapInfo[h][w]=map.getElevation(w,h);
      }
    }
    //console.log(this.elevationMapInfo)
  }
}