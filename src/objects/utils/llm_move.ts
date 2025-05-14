// src/llm/LLMMove.ts

import Phaser from "phaser";
import { MainScene } from "../../scenes/main_scene";

interface MoveCommand {
  unitId: number;
  x: number;
  y: number;
  queue?: boolean;
}

export async function triggerLLMMove(mainScene: MainScene) {
  console.log("🧠 triggerLLMMove started");

  // 1) Fetch everything from the scene
  const elevationMap = mainScene.getElevationMapInfo();
  const units = mainScene.getUnitPosList();
  const unitManager = mainScene.getUnitManager();

  // 2) Log each so you can see what's actually coming through
  console.log("🔍 elevationMapInfo:", elevationMap);
  console.log("🔍 unitPosList:", units);
  console.log("🔍 unitManager:", unitManager);

  // 3) Bail only if truly missing
  if (elevationMap == null) {
    console.error("❌ elevationMapInfo is null or undefined");
    return;
  }
  if (units == null) {
    console.error("❌ unitPosList is null or undefined");
    return;
  }
  if (unitManager == null) {
    console.error("❌ unitManager is null or undefined");
    return;
  }

  // 4) Tools for the fake LLM to play with
  const tools = {
    estimateFuel: (unitId: number, x: number, y: number): number => {
      const unit = unitManager.getAllUnits().find(u => u.getId() === unitId);
      if (!unit) throw new Error(`Invalid unit ID: ${unitId}`);

      // in case your Unit needs the elevation map injected:
      unit.setElevationMap(elevationMap);
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

  // 5) Replace this with your real LLM call when ready
  const plan: MoveCommand[] = await fakeLLMPlan(units, tools);

  // 6) Execute the plan
  for (const cmd of plan) {
    if (cmd.queue) tools.moveUnitToQueue(cmd.unitId, cmd.x, cmd.y);
    else         tools.moveUnitTo(cmd.unitId, cmd.x, cmd.y);
  }

  console.log("✅ triggerLLMMove complete");
}


async function fakeLLMPlan(
  units: { id: number; x: number; y: number; name: string }[],
  tools: {
    estimateFuel: (unitId: number, x: number, y: number) => number;
    moveUnitTo:    (unitId: number, x: number, y: number) => void;
    moveUnitToQueue: (unitId: number, x: number, y: number) => void;
  }
): Promise<MoveCommand[]> {
  const result: MoveCommand[] = [];

  for (const u of units) {
    // simple test: try moving 20px right
    const tx = u.x + 20;
    const ty = u.y;
    const fuel = tools.estimateFuel(u.id, tx, ty);

    // only move if “fuel < 50”
    if (fuel < 50) {
      result.push({ unitId: u.id, x: tx, y: ty });
    }
  }

  return result;
}
