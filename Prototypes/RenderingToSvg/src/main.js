import { getStroke } from 'perfect-freehand';

// ----- setting up events and main loop -----

const eventQueue = [];

window.nativeEvent = (eventState, touches) => {
  eventQueue.push({ eventState, touches });
};

let pointsInCurrentStroke = null;

function onFrame(_ts) {
  for (const event of eventQueue) {
    processEvent(event);
  }
  eventQueue.length = 0;

  if (pointsInCurrentStroke != null) {
    updateCurrentPath();
  }

  requestAnimationFrame(onFrame);
}

requestAnimationFrame(onFrame);

// ----- processing events -----

function toStrokePoint(eventPoint) {
  return [
    eventPoint.x,
    eventPoint.y,
    eventPoint.force
  ];
}

function processEvent(event) {
  for (const [_id, points] of Object.entries(event.touches)) {
    // only pay attention to pencil events for now
    if (points[0].type !== 'pencil') {
      continue;
    }

    function extendStroke(p) {
      pointsInCurrentStroke.push(toStrokePoint(p));
    }

    switch (event.eventState) {
      case 'began': {
        pointsInCurrentStroke = [toStrokePoint(points[0])];
        appendNewPath();
        break;
      }
      case 'moved': {
        points.forEach(extendStroke);
        break;
      }
      case 'ended': {
        extendStroke(points[0]);
        updateCurrentPath();
        console.log(pointsInCurrentStroke.length);
        pointsInCurrentStroke = null;
        break;
      }
    }
  }
}

// ----- rendering paths -----

const svg = document.getElementById('svg');

const getStrokeOptions = {
  size: 1.5,
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
  const stroke = getStroke(pointsInCurrentStroke, getStrokeOptions);
  const pathData = toSvgPath(stroke);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttributeNS(null, 'd', pathData);
  // path.setAttributeNS(null, 'transform', 'rotate(30) translate(40, 50)');
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
