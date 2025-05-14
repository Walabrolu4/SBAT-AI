// src/llm/LLMMove.ts

import Phaser from "phaser";
import { MainScene } from "../../scenes/main_scene";
import { UnitData } from "./utils";


interface MoveCommand {
  unitId: number;
  x: number;
  y: number;
  queue?: boolean;
}

export async function triggerLLMMove(mainScene: MainScene) {
  console.log("🧠 triggerLLMMove started");

  // pull in UnitData[]
  const units = mainScene.getUnitPosList();       
  const unitManager = mainScene.getUnitManager(); 

  console.log("🔍 unitPosList:", units);
  console.log("🔍 unitManager:", unitManager);

  if (!Array.isArray(units)) {
    console.error("❌ unitPosList is not an array!");
    return;
  }
  if (!unitManager) {
    console.error("❌ unitManager is null or undefined");
    return;
  }

  const tools = {
    estimateFuel: (unitId: number, x: number, y: number): number => {
      const unit = unitManager.getAllUnits().find(u => u.getId() === unitId);
      if (!unit) throw new Error(`Invalid unit ID: ${unitId}`);

      const fuel = unit.estimateFuelUsageTo(new Phaser.Math.Vector2(x, y));
      console.log(`⚡ [estimateFuel] unit ${unitId} → (${x},${y}) = ${fuel}`);
      return fuel;
    },

    moveUnitTo: (unitId: number, x: number, y: number): void => {
      console.log(`🚀 [moveUnitTo] unit ${unitId} → (${x},${y})`);
      unitManager.moveUnitTo(unitId, x, y);
    },

    moveUnitToQueue: (unitId: number, x: number, y: number): void => {
      console.log(`📌 [moveUnitToQueue] unit ${unitId} → (${x},${y})`);
      unitManager.moveUnitToQueue(unitId, x, y);
    }
  };

  // use the correct UnitData fields in the fake planner
  const plan: MoveCommand[] = await fakeLLMPlan(units, tools);

  // execute
  for (const cmd of plan) {
    if (cmd.queue) tools.moveUnitToQueue(cmd.unitId, cmd.x, cmd.y);
    else          tools.moveUnitTo(cmd.unitId, cmd.x, cmd.y);
  }

  console.log("✅ triggerLLMMove complete");
}


async function fakeLLMPlan(
  units: UnitData[],
  tools: {
    estimateFuel: (unitId: number, x: number, y: number) => number;
    moveUnitTo:    (unitId: number, x: number, y: number) => void;
    moveUnitToQueue:(unitId: number, x: number, y: number) => void;
  }
): Promise<MoveCommand[]> {
  const result: MoveCommand[] = [];

  for (const u of units) {
    const { unitId, position } = u;
    const tx = 400;  // example: 20px right
    const ty = 400;

    const fuel = tools.estimateFuel(unitId, tx, ty);
    if (fuel < 50) {
      result.push({ unitId, x: tx, y: ty });
    }
  }

  return result;
}
