import Vec, { Vector } from "../../lib/vec";
import { Position, PositionWithPressure } from "../../lib/types";
import Page from "../Page";
import SVG from "../Svg";
import YodaStroke from "../strokes/YodaStroke";
import { Tool } from "./Tool";
import Point from "../strokes/Point";

export default class Yoda extends Tool {
  stroke?: YodaStroke;
  point?: Point;
  recentVelocities: Vector[] = [];
  lastPosition?: PositionWithPressure;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
  }

  startStroke(position: PositionWithPressure) {
    // Grab an existing stroke if we start drawing near it's endpoint
    this.point = this.page.findPointNear(position, 8);

    if (this.point) {
      this.stroke = this.point.stroke;
    } else {
      const start = this.page.addPoint(position);
      const end = this.page.addPoint(position);
      this.point = end;
      this.stroke = new YodaStroke(this.svg, start, end, [position]);
      this.page.addStroke(this.stroke);
    }

    this.lastPosition = position;
    this.recentVelocities = [];
  }

  extendStroke(position: PositionWithPressure) {
    if (!this.stroke || !this.point || !this.lastPosition) return;

    // First, we'll measure how far the pencil has moved, and how quickly

    // Figure out how far the pencil has moved since the last position that we captured
    let currentVelocity = Vec.sub(position, this.lastPosition);

    // If the pencil hasn't yet moved far enough, bail
    if (Vec.len(currentVelocity) < 1) return;

    // Cut down on noise from handling multiple pencil events per frame
    SVG.clearNow();

    // Add the new pencil movement into the list of recent velocities
    this.recentVelocities.unshift(currentVelocity);

    // Track the overall velocity of the pencil by averaging up to this many recent events
    let nRecentVelocities = 10;

    // Keep the list of recent velocities short
    this.recentVelocities.splice(nRecentVelocities, Infinity);

    // Save the new position so we can calculate the velocity next time
    this.lastPosition = position;

    // Add up all the recent velocity vectors
    let pencilVelocity = this.recentVelocities.reduce(Vec.add, Vec());

    // Turn pencilVelocity into an average
    pencilVelocity = Vec.divS(pencilVelocity, this.recentVelocities.length);

    // Great, we're done measuring pencil velocity. But before we go any further…

    // If the array is too short, we don't want to remove points from it, only add to it!
    let minLength = this.stroke.age < 20 ? 20 : 2;
    if (this.stroke.points.length <= minLength) {
      this.doExtend(position, this.point, this.stroke);
      return;
    }

    // Alright, let's now measure the most recent points in the stroke.

    // Make a copy of the points array, so we can safely mutate it
    let points = Array.from(this.stroke.points);

    // Make sure the array is sorted so that the closest point is at the beginning
    if (this.point == this.stroke.end) {
      points = points.reverse();
    }

    // Build a vector of the average direction of the most recent points
    let nRecentPoints = 10;
    let recentPoints = points.slice(0, nRecentPoints);
    let strokeDirection = recentPoints.reduce((acc, v, i) => {
      return i === 0 ? acc : Vec.add(acc, Vec.sub(recentPoints[i - 1], v));
    }, Vec());

    // Visualize
    debugLine("red", points[0], Vec.add(points[0], Vec.renormalize(strokeDirection, 100)));
    debugLine("blue", position, Vec.add(position, Vec.renormalize(pencilVelocity, 100)));

    // Look at how far away the pencil is from the last few points in the stroke

    // YO: The number of points doesn't matter — we want to look at how far away the points are,
    // and probably look further away the faster we're moving, and then cull points until the
    // end of the stroke is close to the pencil.

    // Maybe: find the closest point to the pencil, and cull all the points after that?
    // Maybe: cull all the points that are close together?

    // Maybe: look for pairs of points that have a vec pointing one way, and pairs of points
    // with a vec pointing the opposite way, and then cull back to the earlier pair?

    // Keep all the points, but skip the dead ones?

    let distancesToRecentPoints = points.slice(0, 20).map((p) => Vec.dist(position, p));

    // If the pencil gets close to any of those points, we want to count that as a retraction
    // The further the point, the more generous the radius we'll look for
    distancesToRecentPoints.forEach((dist, i) => {
      if (dist < i / 2) {
        while (i-- > 0) {
          this.doRetract(this.point!, this.stroke!, "red");
        }
        return;
      }
    });

    // this.doExtend(position, this.point, this.stroke);
    // return;

    // Figure out how much overlap we have between the stroke direction and pencil velocity
    let dot = Vec.dot(Vec.normalize(strokeDirection), Vec.normalize(pencilVelocity));

    SVG.now("text", { x: 100, y: 150, fill: "red", content: dot });

    // If the pencil is moving in the same direction as the stroke, we should extend the stroke
    if (dot > -0.9) {
      return this.doExtend(position, this.point, this.stroke);
    }

    SVG.now("text", { x: 300, y: 100, fill: "black", content: "YOLO" });

    // If the pencil is moving backward toward the existing stroke, retract
    // The rate that the pencil is moving determines how far we can be from the stroke while still culling

    // Figure out how fast the pencil is moving
    let pencilSpeed = this.recentVelocities.reduce((s, v) => s + Vec.len(v), 0);

    // Turn pencilSpeed into an average
    pencilSpeed /= this.recentVelocities.length;

    // Figure out how large an area to remove
    let cullRadius = Math.max(15, 10 * pencilSpeed);

    // Visualize
    SVG.now("text", { x: 100, y: 100, fill: "black", content: cullRadius });

    if (Vec.dist(position, points[0]) < cullRadius) {
      this.doRetract(this.point, this.stroke, "yellow");
    }
  }

  private doRetract(point: Point, stroke: YodaStroke, color: string) {
    // Remove the last point from the start or end of the stroke array
    let p: PositionWithPressure | undefined;
    if (point == stroke.end) {
      p = stroke.points.pop();
    } else {
      p = stroke.points.shift();
    }
    if (p) stroke.deadPoints.push({ ...p, color });
    stroke.updatePoints();
    stroke.dirty = true;
  }

  private doExtend(position: PositionWithPressure, point: Point, stroke: YodaStroke) {
    // Add the current point to the start or end of the stroke array
    if (point == stroke.end) {
      stroke.points.push(position);
    } else {
      stroke.points.unshift(position);
    }

    // Increment the stroke's age
    stroke.age++;
    stroke.updatePoints();
    stroke.dirty = true;
  }

  endStroke() {
    if (!this.stroke) return;

    // If the stroke is too short, remove it
    // But… we don't have a way to remove strokes, so just hide it
    if (this.stroke.points.length < 3) {
      this.stroke.points = [];
    }

    this.stroke.finished = true;
    this.stroke = undefined;
    this.point = undefined;
  }
}

function debugLine(c: string, ...points: Position[]) {
  SVG.now("polyline", { points: SVG.points(points), stroke: c });
}
