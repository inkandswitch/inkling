import Vec from '../lib/vec';
import Events, { Event } from './NativeEvents';
import Page from './Page';
import FreehandStroke, { aFreehandStroke } from './strokes/FreehandStroke';
import { aCanonicalHandle } from './strokes/Handle';

export default class FreehandSelection {
  readonly selectedStrokes = new Set<FreehandStroke>();
  private clusterSelectionIndex = 0;

  // Interaction State
  private fingerDown: Event | null = null;
  private fingerMoved: Event | null = null;

  constructor(private readonly page: Page) {}

  update(events: Events) {
    const fingerDown = events.find('finger', 'began');
    if (fingerDown) {
      this.fingerDown = fingerDown;
      const foundStroke = this.page.find({
        what: aFreehandStroke,
        nearPosition: fingerDown.position,
      });
      const foundHandle = this.page.find({
        what: aCanonicalHandle,
        nearPosition: fingerDown.position,
      });

      // Register longpress
      window.setTimeout(() => {
        if (
          this.fingerDown &&
          (!this.fingerMoved ||
            Vec.dist(this.fingerDown.position, this.fingerMoved.position) < 10)
        ) {
          this.createGroupFromSelection();
        }
      }, 750);

      if (foundStroke && !foundHandle) {
        this.fingerDownOnStroke(foundStroke);
      } else {
        this.fingerDownOnEmptySpace();
      }
    }

    if (this.fingerDown) {
      const fingerMoved = events.find('finger', 'moved', this.fingerDown.id);
      if (fingerMoved) {
        this.fingerMoved = fingerMoved;
      }

      const fingerEnded = events.find('finger', 'ended', this.fingerDown.id);
      if (fingerEnded) {
        this.fingerDown = null;
        this.fingerMoved = null;
      }
    }
  }

  private createGroupFromSelection() {
    // It doesn't make sense for the same stroke to be in more than one group.
    // E.g., what transform applies when the user has moved handles associated
    // with the more than one group that the stroke belongs to? That's why
    // we only consider strokes that are not already in a group.
    const ungroupedStrokes = new Set(
      Array.from(this.selectedStrokes).filter(s => !s.group)
    );
    if (ungroupedStrokes.size > 0) {
      this.page.addStrokeGroup(ungroupedStrokes);
      for (const stroke of ungroupedStrokes) {
        stroke.deselect();
      }
    }
  }

  private fingerDownOnStroke(stroke: FreehandStroke) {
    if (this.selectedStrokes.has(stroke)) {
      const clusters = this.page.clusters.getClustersForStroke(stroke);

      console.log(clusters);

      if (!clusters) {
        return;
      }

      this.clusterSelectionIndex++;
      const cluster = clusters.get(
        this.clusterSelectionIndex % clusters.size()
      );

      this.clearSelection();
      for (const stroke of cluster) {
        this.select(stroke);
      }
    } else {
      this.select(stroke);
      if (this.selectedStrokes.size > 1) {
        for (const stroke of this.selectedStrokes) {
          this.page.clusters.addClusterForStroke(stroke, this.selectedStrokes);
        }
      }

      this.clusterSelectionIndex = 0;
    }
  }

  private fingerDownOnEmptySpace() {
    this.clearSelection();
  }

  render() {
    // if (this.selectedStrokes) {
    //   this.selectedStrokes.render()
    // }
  }

  private select(stroke: FreehandStroke) {
    stroke.select();

    // if (stroke.group) {
    //   stroke.group.a.select()
    //   stroke.group.b.select()
    // }

    this.selectedStrokes.add(stroke);
  }

  private clearSelection() {
    for (const stroke of this.selectedStrokes) {
      stroke.deselect();
    }

    this.selectedStrokes.clear();
  }
}
