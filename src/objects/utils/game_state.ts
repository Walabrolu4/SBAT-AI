import Phaser from "phaser";
import { ElevationMap } from "../elevation_map";
import { Unit } from "../unit";
import { UnitData } from "./utils";


export class GameState {
  scene: Phaser.Scene;
  elevationMapInfo: number[][] = [];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public getAllUnitData(units: Unit[]): UnitData[] {
    let unitPositions: UnitData[] = [];
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

  /*
  public getElevationData(map: ElevationMap, width: number, height: number): number[][] {
    let height = map.height;
    let width = map.width;
    for(let h =0 ; h<height; h++){
      this.elevationMapInfo[h] = [];
      for(let w=0; w<width; w++){ƒ
        this.elevationMapInfo[h][w]=map.getElevation(w,h);
      }
    }
    return this.elevationMapInfo;
  }
*/


  public getElevationData(map: ElevationMap): number[][] {
    const w = map.width;   // full pixel width of your heightmap
    const h = map.height;  // full pixel height of your heightmap
    const out: number[][] = [];

    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        row.push(map.getElevation(x, y));
      }
      out.push(row);
    }
    return out;
  }

}