import Arc from '../../lib/arc';
import Fit, { ArcFit, CircleFit, LineFit } from '../../lib/fit';
import Line from '../../lib/line';
import Vec from '../../lib/vec';
import Page from '../Page';
import Snaps from '../Snaps';
import SVG from '../Svg';
import Tool from './Tool';
import Events from '../NativeEvents';
import { Position } from '../../lib/types';
import LineSegment from '../strokes/LineSegment';
import ArcSegment from '../strokes/ArcSegment';

export default class FormalTool extends Tool {
  private readonly element: SVGElement;
  private needsRerender = false;

  // Data for guessing
  private inputPoints?: Position[];
  private idealPoints?: Position[];
  private renderPoints?: Position[];

  // Speed (not velocity, lol)
  private speed = 0;
  private maxSpeed = 0;
  private previousPosition?: Position;

  // Curve fitting
  private mode: 'unknown' | 'guess' | 'fixed' = 'unknown'; // unknown, guess (can still change), fixed
  private fit: LineFit | ArcFit | CircleFit | null = null;

  // Fixed mode
  private fixedStroke?: LineSegment | ArcSegment;

  constructor(
    label: string,
    buttonX: number,
    buttonY: number,
    page: Page,
    private snaps: Snaps
  ) {
    super(label, buttonX, buttonY, page);

    this.element = SVG.add('path', {});
    this.resetElement();
  }

  resetElement() {
    SVG.update(this.element, { d: '', stroke: 'black', fill: 'none' });
  }

  update(events: Events) {
    // PENCIL DOWN
    const pencilDown = events.find('pencil', 'began');
    if (pencilDown) {
      this.inputPoints = [pencilDown.position];
      this.renderPoints = [Vec.clone(pencilDown.position)];

      this.speed = 0;
      this.maxSpeed = 0;
      this.previousPosition = pencilDown.position;

      this.mode = 'unknown';
      this.needsRerender = true;
    }

    // PENCIL MOVE
    const pencilMoves = events.findAll('pencil', 'moved');
    pencilMoves.forEach(pencilMove => {
      // Compute speed
      const newSpeed = Vec.dist(this.previousPosition!, pencilMove.position);
      const alpha = 0.05; // Filter speed to get rid of spikes
      this.speed = alpha * newSpeed + (1 - alpha) * this.speed;
      this.maxSpeed = Math.max(this.maxSpeed, this.speed);
      this.previousPosition = pencilMove.position;

      // Guessing system
      // STATES
      if (this.mode !== 'fixed') {
        // Add point to input buffer
        this.inputPoints!.push(pencilMove.position);
        this.renderPoints!.push(Vec.clone(pencilMove.position));

        // Make a guess
        if (this.mode === 'guess') {
          this.doFit();
        }
      } else {
        const updatedPosition = pencilMove.position;

        const pointPositions = new Map();

        if (!this.fixedStroke) {
          // TODO(marcel): sometimes there's no fixedStroke.
          // E.g., if you just tap on the screen so that the start and end points
          // of a formal stroke are the same. I made a change to Fit.line that
          // I thought would have solved this problem, but it's still happening
          // from time to time. What do you think is the best way to fix this?
          throw new Error('there is no fixed stroke!');
        }

        pointPositions.set(this.fixedStroke.a, this.fixedStroke.a.position);
        pointPositions.set(this.fixedStroke.b, updatedPosition);

        const snappedPositions = this.snaps.snapPositions(pointPositions);

        this.fixedStroke.a.position = snappedPositions.get(this.fixedStroke.a)!;
        this.fixedStroke.b.position = snappedPositions.get(this.fixedStroke.b)!;
      }

      // STATE TRANSITIONS
      // If the stroke is long enough, show feedback of inital guess
      if (this.mode === 'unknown' && this.inputPoints!.length > 100) {
        this.mode = 'guess';
      }

      // If the user slows down, and the stroke is long enough, switch to fixed mode
      if (
        this.mode !== 'fixed' &&
        this.inputPoints!.length > 10 &&
        this.speed < Math.min(1, this.maxSpeed)
      ) {
        this.doFit();
        this.createStroke();
        this.clearGuess();
        this.mode = 'fixed';
      }

      this.needsRerender = true;
    });

    // PENCIL UP
    const pencilUp = events.find('pencil', 'ended');
    if (pencilUp) {
      if (this.mode !== 'fixed') {
        this.doFit();
        this.createStroke();
        this.clearGuess();
      }

      if (!this.fixedStroke) {
        // TODO(marcel): sometimes there's no fixedStroke.
        // E.g., if you just tap on the screen so that the start and end points
        // of a formal stroke are the same. I made a change to Fit.line that
        // I thought would have solved this problem, but it's still happening
        // from time to time. What do you think is the best way to fix this?
        throw new Error('there is no fixed stroke!');
      }

      this.fixedStroke.a.absorbNearbyHandles();
      this.fixedStroke.b.absorbNearbyHandles();

      this.fixedStroke = undefined;
      this.mode = 'unknown';

      this.snaps.clear();
    }

    // Interpolate animation render points
    if (
      this.idealPoints &&
      this.renderPoints!.length === this.idealPoints.length
    ) {
      for (let i = 0; i < this.idealPoints.length; i++) {
        this.renderPoints![i] = Vec.lerp(
          this.idealPoints[i],
          this.renderPoints![i],
          0.8
        );
      }
    }
  }

  doFit() {
    const lineFit = Fit.line(this.inputPoints!);
    const arcFit = Fit.arc(this.inputPoints!);
    const circleFit = Fit.circle(this.inputPoints!);

    this.fit = lineFit;
    if (
      arcFit &&
      Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 0.4 * Math.PI &&
      (!lineFit || arcFit.fitness < lineFit.fitness)
    ) {
      this.fit = arcFit;

      if (
        circleFit &&
        Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 1.5 * Math.PI &&
        circleFit.circle.radius < 500 &&
        circleFit.fitness < arcFit.fitness
      ) {
        this.fit = circleFit;
      }
    }

    if (this.fit) {
      this.updateIdeal();
    }
  }

  // Use fitted shape to create a stroke
  createStroke() {
    if (!this.fit) {
      throw new Error('createStroke() called w/ no fit!');
    }

    if (this.fit.type === 'line') {
      const stroke = this.page.addLineSegment(this.fit.line.a, this.fit.line.b);
      this.fixedStroke = stroke;
    } else if (this.fit.type === 'arc') {
      const { start, end } = Arc.points(this.fit.arc);
      const stroke = this.page.addArcSegment(start, end, this.fit.arc.center);
      this.fixedStroke = stroke;
    }
  }

  clearGuess() {
    this.inputPoints = undefined;
    this.idealPoints = undefined;
    this.renderPoints = undefined;
    this.resetElement();
  }

  // Smooth animation
  updateIdeal() {
    if (!this.fit) {
      throw new Error('updateIdeal() called w/ no fit!');
    }

    switch (this.fit.type) {
      case 'line':
        this.idealPoints = Line.spreadPointsAlong(
          this.fit.line,
          this.inputPoints!.length
        );
        break;
      case 'arc':
        this.idealPoints = Arc.spreadPointsAlong(
          this.fit.arc,
          this.inputPoints!.length
        );
        break;
      case 'circle':
        this.idealPoints = Arc.spreadPointsAlong(
          this.fit.circle,
          this.inputPoints!.length
        );
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error('unsupported fit type: ' + (this.fit as any).type);
    }
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    if (this.renderPoints) {
      SVG.update(this.element, { d: SVG.path(this.renderPoints) });
    }

    this.needsRerender = false;
  }
}
