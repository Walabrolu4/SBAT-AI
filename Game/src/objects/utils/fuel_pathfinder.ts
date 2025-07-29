import { ElevationMap } from "../elevation_map";
import Phaser from "phaser";
import { Unit } from "../unit";

const Vec2 = Phaser.Math.Vector2;
type Vec2 = Phaser.Math.Vector2;

interface Node {
  pos: Phaser.Math.Vector2;
  g: number;
  h: number;
  f: number;
  parent?: Node;
}

function heuristic(a: Vec2, b: Vec2): number {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function toKey(vec: Vec2): string {
  return `${Math.round(vec.x)},${Math.round(vec.y)}`;
}

function getNeighbors(pos: Vec2, step = 10): Vec2[] {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  return dirs.map(([dx, dy]) => new Vec2(pos.x + dx * step, pos.y + dy * step));
}

export function findFuelOptimalPath(
  elevationMap: ElevationMap,
  start: Vec2,
  goal: Vec2,
  unit: Unit,
  maxIterations = 100000
): Vec2[] {
  const step = 10;
  const open: Node[] = [];
  const closed = new Set<string>();

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
    console.warn("❌ Start or goal is out of bounds.");
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
    let bestIndex = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIndex].f) bestIndex = i;
    }
    const current = open.splice(bestIndex, 1)[0];

    const currentKey = toKey(current.pos);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    if (current.pos.distance(goal) <= step) {
      const path: Vec2[] = [];
      let node: Node | undefined = current;
      while (node) {
        path.unshift(node.pos.clone());
        node = node.parent;
      }
      return path;
    }

    for (const neighbor of getNeighbors(current.pos, step)) {
      const neighborKey = toKey(neighbor);
      if (closed.has(neighborKey)) continue;

      const curElev = elevationMap.getElevation(current.pos.x, current.pos.y);
      const nextElev = elevationMap.getElevation(neighbor.x, neighbor.y);
      if (curElev === -99 || nextElev === -99) continue;

      const slope = nextElev - curElev;
      const slopeFactor = 1 + Math.abs(slope) * 45;
      const distance = current.pos.distance(neighbor);
      const baseFuelConsumption = 0.1;
      const fuelCost = distance * baseFuelConsumption * slopeFactor;

      const g = current.g + fuelCost;
      const h = heuristic(neighbor, goal);
      const f = g + h; // * 0.05;

      const existing = open.find((n) => toKey(n.pos) === neighborKey);
      if (existing && existing.g <= g) continue;

      open.push({ pos: neighbor.clone(), g, h, f, parent: current });
    }
  }

  console.warn("⚠️ Path not found, returning best effort path.");
  let fallback = open.reduce((a, b) => (a && a.g > b.g ? a : b), open[0]);
  const path: Vec2[] = [];
  while (fallback) {
    path.unshift(fallback.pos.clone());
    fallback = fallback.parent!;
  }
  return path;
}
