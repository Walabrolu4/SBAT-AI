// Game/src/objects/utils/llm_move.ts

import Phaser from "phaser";
import { MainScene } from "../../scenes/main_scene";
import { UnitData } from "./utils"; // Assuming UnitData type is defined here

/**
 * Defines the structure of a single unit's movement plan as returned by the LLM.
 * It includes the unit's ID and an array of (x, y) coordinates representing the path.
 */
interface UnitMovePlan {
  unitId: number;
  path: { x: number; y: number }[]; // An array of waypoints for the unit to follow
}

/**
 * Initiates the LLM's move decision process, allowing it to evaluate multiple paths
 * for fuel efficiency and select the best one.
 * @param mainScene The current Phaser MainScene instance.
 * @param numTestMoves The number of alternative paths the LLM should evaluate for each unit. Defaults to 5.
 */
export async function triggerLLMMove(mainScene: MainScene, numTestMoves: number = 5) {
  console.log("🧠 TriggerLLMMove started with numTestMoves:", numTestMoves);

  // Retrieve current unit data from the game scene
  const units = mainScene.getUnitPosList();
  // Retrieve the unit manager for executing moves later
  const unitManager = mainScene.getUnitManager();
  // Retrieve the elevation map data (2D array of numbers)
  const elevationMapInfo = mainScene.getElevationMapInfo();

  console.log("🔎 unitPoslist:", units);
  console.log("🔎 unitManager:", unitManager);
  console.log("🔎 elevationMapInfo (first 5 rows):", elevationMapInfo.slice(0, 5));

  // Basic validation to ensure essential data is available
  if (!Array.isArray(units)) {
    console.error("❌ units is not an array!");
    return;
  }
  if (!unitManager) {
    console.error("❌ unitManager is not defined!");
    return;
  }

  // Define local "tools" or helper functions that wrap game logic.
  // The LLM will be instructed in its prompt to reason about these capabilities.
  const tools = {
    /**
     * Executes a series of waypoints for a unit by queuing them up.
     * This function uses the UnitManager's `queueMoveToLocation` method.
     */
    executeUnitPath: (unitId: number, path: { x: number; y: number }[]): void => {
      const unit = unitManager.getAllUnits().find((u) => u.getId() === unitId);
      if (!unit) {
        console.warn(`Attempted to move invalid unit ID: ${unitId}`);
        return;
      }
      if (path.length === 0) {
        console.log(`Unit ${unitId} received an empty path.`);
        return;
      }

      // Clear existing queue and add the first waypoint (assuming it's a new plan)
      unit.queueMoveToLocation(new Phaser.Math.Vector2(path[0].x, path[0].y), true);

      // Add subsequent waypoints to the queue
      for (let i = 1; i < path.length; i++) {
        unit.queueMoveToLocation(new Phaser.Math.Vector2(path[i].x, path[i].y), false);
      }
      console.log(`🚀 Unit ${unitId} received and queued path with ${path.length} waypoints.`);
    },
  };

  // The instruction for the LLM. This will be critical for guiding its pathfinding logic.
  // This instruction aligns with the prompt we built in the Colab notebook.
  const instruction = `
    For each unit, generate ${numTestMoves} distinct potential movement paths (sequences of waypoints) Towards (500,500)
    Each path should consist of 1 to 5 waypoints.
    For each generated path, estimate its total fuel cost by considering the elevation changes between consecutive waypoints.
    The fuel cost increases significantly with the absolute difference in elevation between adjacent points.
    After evaluating all ${numTestMoves} paths for a unit, select the path that has the lowest estimated fuel consumption.
    Then, provide this selected optimal path for each unit.
    `;

  try {
    // Make a POST request to your Colab-hosted Flask backend.
    // IMPORTANT: Replace "YOUR_NGROK_URL" with the actual public URL
    // printed in your Colab notebook after starting Ngrok.
    const response = await fetch("https://b374-34-127-70-181.ngrok-free.app/llm/move", { // <--- UPDATE THIS LINE WITH YOUR NGROK URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the current units data, the instruction, the elevation map info,
      // and the number of test moves the LLM should attempt.
      body: JSON.stringify({ units, instruction, elevationMapInfo, numTestMoves }),
    });

    // Check if the HTTP response was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Parse the JSON response from the LLM backend
    const result = await response.json();

    // Validate the structure of the LLM's response
    if (!result.plan || !Array.isArray(result.plan)) {
      console.error("❌ LLM did not return a valid plan (expected an array):", result);
      return;
    }

    // Iterate through the plan received from the LLM and execute each unit's path
    const plan: UnitMovePlan[] = result.plan;
    for (const unitPlan of plan) {
      if (unitPlan.unitId !== undefined && Array.isArray(unitPlan.path)) {
        tools.executeUnitPath(unitPlan.unitId, unitPlan.path); // Execute the path using the local game logic
      } else {
        console.warn("Received malformed unit plan from LLM:", unitPlan);
      }
    }

    console.log("✅ LLM Move plan executed successfully.");
  } catch (error) {
    console.error("❌ Error executing LLM Move plan:", error);
  }
}
