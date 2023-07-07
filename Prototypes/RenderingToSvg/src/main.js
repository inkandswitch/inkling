import { getStroke } from 'perfect-freehand';

// ----- setting up events and main loop -----

const eventQueue = [];

window.nativeEvent = (eventState, touches) => {
  eventQueue.push({ eventState, touches });
};

function onFrame(_ts) {
  eventQueue.forEach(processEvent);
  eventQueue.length = 0;

  requestAnimationFrame(onFrame);
}

requestAnimationFrame(onFrame);

// ----- processing events -----

let currentStrokePoints = null;

function toStrokePoint(eventPoint) {
  return [
    eventPoint.x,
    eventPoint.y,
    eventPoint.force
  ];
}

function newStroke(p) {
  currentStrokePoints = [toStrokePoint(p)];
  appendNewPath();
}

function extendStroke(p) {
  currentStrokePoints.push(toStrokePoint(p));
  updateCurrentPath();
}

function processEvent(event) {
  for (const [_id, points] of Object.entries(event.touches)) {
    // only pay attention to pencil events for now
    if (points[0].type !== 'pencil') {
      continue;
    }

    switch (event.eventState) {
      case 'began': {
        newStroke(points[0]);
        break;
      }
      case 'moved': {
        points.forEach(extendStroke);
        break;
      }
      case 'ended': {
        extendStroke(points[0]);
        break;
      }
    }
  }
}

// ----- rendering paths -----

const svg = document.getElementById('svg');

const getStrokeOptions = {
  size: 1,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true
  },
  end: {
    taper: 0,
    easing: (t) => t,
    cap: true
  },
  simulatePressure: false,
};

function appendNewPath() {
  const stroke = getStroke(currentStrokePoints, getStrokeOptions);
  const pathData = toSvgPath(stroke);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttributeNS(null, 'd', pathData);
  svg.appendChild(path);
}

function updateCurrentPath() {
  svg.removeChild(svg.lastChild);
  appendNewPath();
}

function toSvgPath(stroke) {
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}
