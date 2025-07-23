import { ElevationMap } from "../elevation_map";
import Phaser from "phaser";

const Vec2 = Phaser.Math.Vector2;

interface Node {
  pos: Phaser.Math.Vector2;
  g: number; // fuel cost from start
  h: number; // heuristic (distance to goal)
  f: number; // g + h
  parent?: Node;
}

function heuristic(a: Phaser.Math.Vector2, b: Phaser.Math.Vector2): number {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function getNeighbors(
  pos: Phaser.Math.Vector2,
  step = 5
): Phaser.Math.Vector2[] {
  return [
    new Vec2(pos.x + step, pos.y),
    new Vec2(pos.x - step, pos.y),
    new Vec2(pos.x, pos.y + step),
    new Vec2(pos.x, pos.y - step),
    new Vec2(pos.x + step, pos.y + step),
    new Vec2(pos.x - step, pos.y - step),
    new Vec2(pos.x + step, pos.y - step),
    new Vec2(pos.x - step, pos.y + step),
  ];
}

export function findFuelOptimalPath(
  elevationMap: ElevationMap,
  start: Phaser.Math.Vector2,
  goal: Phaser.Math.Vector2,
  maxIterations = 100000
): Phaser.Math.Vector2[] {
  const open: Node[] = [];
  const closed = new Set<string>();
  const step = 5;
  start = new Vec2(
    Math.round(start.x / step) * step,
    Math.round(start.y / step) * step
  );
  goal = new Vec2(
    Math.round(goal.x / step) * step,
    Math.round(goal.y / step) * step
  );

  if (
    elevationMap.getElevation(start.x, start.y) === -99 ||
    elevationMap.getElevation(goal.x, goal.y) === -99
  ) {
    console.warn("❌ Start or Goal is outside elevation map bounds.");
    return [];
  }

  const startNode: Node = {
    pos: start.clone(),
    g: 0,
    h: heuristic(start, goal),
    f: 0,
  };
  startNode.f = startNode.g + startNode.h;

  open.push(startNode);

  let iterations = 0;

  while (open.length > 0 && iterations < maxIterations) {
    iterations++;
    open.sort((a, b) => a.f - b.f); // sort by lowest f
    const current = open.shift();
    if (!current) break;

    const key = `${Math.floor(current.pos.x)},${Math.floor(current.pos.y)}`;
    if (closed.has(key)) continue;
    closed.add(key);

    if (
      Phaser.Math.Distance.Between(
        current.pos.x,
        current.pos.y,
        goal.x,
        goal.y
      ) <= step
    ) {
      // Reached goal!
      console.log("🏁 Reached goal at:", current.pos);
      const path: Phaser.Math.Vector2[] = [];
      let node: Node | undefined = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      console.log(
        "✅ Final path:",
        path.map((p) => `(${p.x}, ${p.y})`).join(" → ")
      );
      return path;
    }

    const neighbors = getNeighbors(current.pos);
    for (const neighbor of neighbors) {
      const nKey = `${Math.floor(neighbor.x)},${Math.floor(neighbor.y)}`;
      if (closed.has(nKey)) continue;

      const curElev = elevationMap.getElevation(current.pos.x, current.pos.y);
      const nextElev = elevationMap.getElevation(neighbor.x, neighbor.y);
      //console.log(`Checking elevation from (${current.pos.x},${current.pos.y}) = ${curElev} to (${neighbor.x},${neighbor.y}) = ${nextElev}`);

      if (curElev === -99 || nextElev === -99) continue; // out of bounds

      const slope = nextElev - curElev;
      const slopeFactor = 1 + Math.abs(slope) * 0.2;
      const distance = current.pos.distance(neighbor);
      const fuelCost = distance * slopeFactor;

      const g = current.g + fuelCost;
      const h = heuristic(neighbor, goal);
      const f = g;

      open.push({
        pos: neighbor.clone(),
        g,
        h,
        f,
        parent: current,
      });
    }
    if (iterations % 500 === 0) {
      console.log(`🔁 Iteration ${iterations}, open nodes: ${open.length}`);
    }
  }

  if (iterations >= maxIterations) {
    console.warn("🛑 Max iterations reached, path not found.");
  }
  if (open.length === 0) {
    console.warn("🛑 Open list empty, no path to goal.");
  }

  console.warn("⚠️ Could not reach goal, returning longest explored path.");

  let fallback: Node | undefined = open.reduce(
    (a, b) => (a.g > b.g ? a : b),
    open[0]
  );

  const partialPath: Phaser.Math.Vector2[] = [];
  while (fallback) {
    partialPath.unshift(fallback.pos.clone());
    fallback = fallback.parent;
  }
  return partialPath;
  //return []; // Failed to find path
}
