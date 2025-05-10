import Phaser from "phaser";
import { ElevationMap } from "../elevation_map";
import { Unit } from "../unit";

export class GameState {
  scene: Phaser.Scene;
  elevationMapInfo: number[][] = [];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public getAllUnitPositions(units:Unit[]){

  }

  public setElevationData(map: ElevationMap, width: number, height: number) {
    for(let h =0 ; h<height; h++){
      this.elevationMapInfo[h] = [];
      for(let w=0; w<width; w++){
        this.elevationMapInfo[h][w]=map.getElevation(w,h);
      }
    }
    console.log(this.elevationMapInfo)
  }
}