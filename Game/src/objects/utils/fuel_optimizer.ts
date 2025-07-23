import { Unit } from "../unit";
import { Vector2 } from "phaser";

const Vector2 = Phaser.Math.Vector2;
/**
 * Generate N naive paths to a target, using random midpoint perturbations.
 */
export function generateCandidatePaths(start: Vector2, end: Vector2, numPaths = 5): Vector2[][] {
  const paths: Vector2[][] = [];

  for (let i = 0; i < numPaths; i++) {
    const midpoints: Vector2[] = [];
    for (let j = 0; j < 3; j++) {
      const t = (j + 1) / 4; // 0.25, 0.5, 0.75 along the line
      const interp = new Vector2(
        start.x + (end.x - start.x) * t + Phaser.Math.Between(-20, 20),
        start.y + (end.y - start.y) * t + Phaser.Math.Between(-20, 20)
      );
      midpoints.push(interp);
    }

    paths.push([start.clone(), ...midpoints, end.clone()]);
  }

  return paths;
}

/**
 * Compute total fuel cost for a given multi-waypoint path.
 */
export function estimateFuelCost(unit: Unit, path: Vector2[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += unit.estimateFuelUsageTo(path[i]);
    //unit.setPos(path[i].x, path[i].y); // simulate next step
  }
  return total;
}

/**
 * Finds the best (lowest-fuel) path from candidates and returns it.
 */
export function findBestPath(unit: Unit, end: Vector2, numCandidates = 5): Vector2[] {
  const start = unit.getPos();
  const candidates = generateCandidatePaths(start, end, numCandidates);
  
  let bestPath = candidates[0];
  let bestCost = Number.MAX_VALUE;

  for (const path of candidates) {
    const cost = estimateFuelCost(unit, path);
    if (cost < bestCost) {
      bestCost = cost;
      bestPath = path;
    }
  }

  return bestPath;
}
