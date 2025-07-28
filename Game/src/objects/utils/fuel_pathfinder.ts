import { ElevationMap } from "../elevation_map";
import Phaser from "phaser";
import { Unit } from "../unit";

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

/*function getNeighbors(
  pos: Phaser.Math.Vector2,
  step = 1
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
}*/

function getNeighbors(
  pos: Phaser.Math.Vector2,
  step = 10,
  directions = 15
): Phaser.Math.Vector2[] {
  const neighbors: Phaser.Math.Vector2[] = [];

  for (let i = 0; i < directions; i++) {
    const angle = (i * 360) / directions;
    const rad = Phaser.Math.DegToRad(angle);

    const dx = Math.round(Math.cos(rad) * step);
    const dy = Math.round(Math.sin(rad) * step);

    // Avoid duplicate center point when angle rounds to (0, 0)
    if (dx !== 0 || dy !== 0) {
      neighbors.push(new Vec2(pos.x + dx, pos.y + dy));
    }
  }

  return neighbors;
}


export function findFuelOptimalPath(
  elevationMap: ElevationMap,
  start: Phaser.Math.Vector2,
  goal: Phaser.Math.Vector2,
  unit: Unit,
  maxIterations = 100000
): Phaser.Math.Vector2[] {
  const open: Node[] = [];
  const closed = new Set<string>();
  const step = 10;
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
      //const fuelCost = distance * slopeFactor;
      const fuelCost = estimateFuelBetweenPoints(
        unit,
        current.pos,
        neighbor,
        elevationMap
      );

      const g = current.g + fuelCost;
      const h = heuristic(neighbor, goal);
      const f = g + h * 0.05;

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

function estimateFuelBetweenPoints(
  unit: Unit,
  from: Phaser.Math.Vector2,
  to: Phaser.Math.Vector2,
  elevationMap: ElevationMap
): number {
  const direction = to.clone().subtract(from);
  const distance = direction.length();

  if (distance === 0) return 0;

  direction.normalize();
  const baseFuelConsumption = 0.1;
  const baseSpeed = unit.getStats().speed;

  let totalFuel = 0;
  const steps = Math.ceil(distance);
  let simPos = from.clone();

  for (let i = 0; i < steps; i++) {
    const nextPos = simPos.clone().add(direction);

    const curElev = elevationMap.getElevation(simPos.x, simPos.y);
    const nextElev = elevationMap.getElevation(nextPos.x, nextPos.y);
    const slope = nextElev - curElev;
    const slopeFactor = 1 + Math.abs(slope) * 0.2;

    const moveDistance = 1;
    const moveDelta = direction.clone().scale(moveDistance);

    const fuelUsed = baseFuelConsumption * moveDelta.length() * slopeFactor;
    totalFuel += fuelUsed;

    simPos.add(moveDelta);
  }

  return totalFuel;
}
