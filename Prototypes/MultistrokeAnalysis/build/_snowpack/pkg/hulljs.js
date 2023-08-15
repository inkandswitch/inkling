function ccw(x1, y1, x2, y2, x3, y3) {
  const cw = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
  return cw > 0 ? true : cw < 0 ? false : true;
}
function intersect(seg1, seg2) {
  const x1 = seg1[0][0], y1 = seg1[0][1], x2 = seg1[1][0], y2 = seg1[1][1], x3 = seg2[0][0], y3 = seg2[0][1], x4 = seg2[1][0], y4 = seg2[1][1];
  return ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) && ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);
}
var intersect_1 = intersect;
function Grid(points, cellSize) {
  this._cells = [];
  this._cellSize = cellSize;
  this._reverseCellSize = 1 / cellSize;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = this.coordToCellNum(point[0]);
    const y = this.coordToCellNum(point[1]);
    if (!this._cells[x]) {
      const array = [];
      array[y] = [point];
      this._cells[x] = array;
    } else if (!this._cells[x][y]) {
      this._cells[x][y] = [point];
    } else {
      this._cells[x][y].push(point);
    }
  }
}
Grid.prototype = {
  cellPoints: function(x, y) {
    return this._cells[x] !== void 0 && this._cells[x][y] !== void 0 ? this._cells[x][y] : [];
  },
  rangePoints: function(bbox) {
    const tlCellX = this.coordToCellNum(bbox[0]);
    const tlCellY = this.coordToCellNum(bbox[1]);
    const brCellX = this.coordToCellNum(bbox[2]);
    const brCellY = this.coordToCellNum(bbox[3]);
    const points = [];
    for (let x = tlCellX; x <= brCellX; x++) {
      for (let y = tlCellY; y <= brCellY; y++) {
        for (let i = 0; i < this.cellPoints(x, y).length; i++) {
          points.push(this.cellPoints(x, y)[i]);
        }
      }
    }
    return points;
  },
  removePoint: function(point) {
    const cellX = this.coordToCellNum(point[0]);
    const cellY = this.coordToCellNum(point[1]);
    const cell = this._cells[cellX][cellY];
    let pointIdxInCell;
    for (let i = 0; i < cell.length; i++) {
      if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
        pointIdxInCell = i;
        break;
      }
    }
    cell.splice(pointIdxInCell, 1);
    return cell;
  },
  trunc: Math.trunc || function(val) {
    return val - val % 1;
  },
  coordToCellNum: function(x) {
    return this.trunc(x * this._reverseCellSize);
  },
  extendBbox: function(bbox, scaleFactor) {
    return [
      bbox[0] - scaleFactor * this._cellSize,
      bbox[1] - scaleFactor * this._cellSize,
      bbox[2] + scaleFactor * this._cellSize,
      bbox[3] + scaleFactor * this._cellSize
    ];
  }
};
function grid(points, cellSize) {
  return new Grid(points, cellSize);
}
var grid_1 = grid;
var format = {
  toXy: function(pointset, format2) {
    if (format2 === void 0) {
      return pointset.slice();
    }
    return pointset.map(function(pt) {
      const _getXY = new Function("pt", "return [pt" + format2[0] + ",pt" + format2[1] + "];");
      return _getXY(pt);
    });
  },
  fromXy: function(pointset, format2) {
    if (format2 === void 0) {
      return pointset.slice();
    }
    return pointset.map(function(pt) {
      const _getObj = new Function("pt", "const o = {}; o" + format2[0] + "= pt[0]; o" + format2[1] + "= pt[1]; return o;");
      return _getObj(pt);
    });
  }
};
function _cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
function _upperTangent(pointset) {
  const lower = [];
  for (let l = 0; l < pointset.length; l++) {
    while (lower.length >= 2 && _cross(lower[lower.length - 2], lower[lower.length - 1], pointset[l]) <= 0) {
      lower.pop();
    }
    lower.push(pointset[l]);
  }
  lower.pop();
  return lower;
}
function _lowerTangent(pointset) {
  const reversed = pointset.reverse(), upper = [];
  for (let u = 0; u < reversed.length; u++) {
    while (upper.length >= 2 && _cross(upper[upper.length - 2], upper[upper.length - 1], reversed[u]) <= 0) {
      upper.pop();
    }
    upper.push(reversed[u]);
  }
  upper.pop();
  return upper;
}
function convex(pointset) {
  const upper = _upperTangent(pointset), lower = _lowerTangent(pointset);
  const convex2 = lower.concat(upper);
  convex2.push(pointset[0]);
  return convex2;
}
var convex_1 = convex;
function _filterDuplicates(pointset) {
  const unique = [pointset[0]];
  let lastPoint = pointset[0];
  for (let i = 1; i < pointset.length; i++) {
    const currentPoint = pointset[i];
    if (lastPoint[0] !== currentPoint[0] || lastPoint[1] !== currentPoint[1]) {
      unique.push(currentPoint);
    }
    lastPoint = currentPoint;
  }
  return unique;
}
function _sortByX(pointset) {
  return pointset.sort(function(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  });
}
function _sqLength(a, b) {
  return Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2);
}
function _cos(o, a, b) {
  const aShifted = [a[0] - o[0], a[1] - o[1]], bShifted = [b[0] - o[0], b[1] - o[1]], sqALen = _sqLength(o, a), sqBLen = _sqLength(o, b), dot = aShifted[0] * bShifted[0] + aShifted[1] * bShifted[1];
  return dot / Math.sqrt(sqALen * sqBLen);
}
function _intersect(segment, pointset) {
  for (let i = 0; i < pointset.length - 1; i++) {
    const seg = [pointset[i], pointset[i + 1]];
    if (segment[0][0] === seg[0][0] && segment[0][1] === seg[0][1] || segment[0][0] === seg[1][0] && segment[0][1] === seg[1][1]) {
      continue;
    }
    if (intersect_1(segment, seg)) {
      return true;
    }
  }
  return false;
}
function _occupiedArea(pointset) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = pointset.length - 1; i >= 0; i--) {
    if (pointset[i][0] < minX) {
      minX = pointset[i][0];
    }
    if (pointset[i][1] < minY) {
      minY = pointset[i][1];
    }
    if (pointset[i][0] > maxX) {
      maxX = pointset[i][0];
    }
    if (pointset[i][1] > maxY) {
      maxY = pointset[i][1];
    }
  }
  return [
    maxX - minX,
    maxY - minY
  ];
}
function _bBoxAround(edge) {
  return [
    Math.min(edge[0][0], edge[1][0]),
    Math.min(edge[0][1], edge[1][1]),
    Math.max(edge[0][0], edge[1][0]),
    Math.max(edge[0][1], edge[1][1])
  ];
}
function _midPoint(edge, innerPoints, convex2) {
  let point = null, angle1Cos = MAX_CONCAVE_ANGLE_COS, angle2Cos = MAX_CONCAVE_ANGLE_COS, a1Cos, a2Cos;
  for (let i = 0; i < innerPoints.length; i++) {
    a1Cos = _cos(edge[0], edge[1], innerPoints[i]);
    a2Cos = _cos(edge[1], edge[0], innerPoints[i]);
    if (a1Cos > angle1Cos && a2Cos > angle2Cos && !_intersect([edge[0], innerPoints[i]], convex2) && !_intersect([edge[1], innerPoints[i]], convex2)) {
      angle1Cos = a1Cos;
      angle2Cos = a2Cos;
      point = innerPoints[i];
    }
  }
  return point;
}
function _concave(convex2, maxSqEdgeLen, maxSearchArea, grid2, edgeSkipList) {
  let midPointInserted = false;
  for (let i = 0; i < convex2.length - 1; i++) {
    const edge = [convex2[i], convex2[i + 1]];
    const keyInSkipList = edge[0][0] + "," + edge[0][1] + "," + edge[1][0] + "," + edge[1][1];
    if (_sqLength(edge[0], edge[1]) < maxSqEdgeLen || edgeSkipList.has(keyInSkipList)) {
      continue;
    }
    let scaleFactor = 0;
    let bBoxAround = _bBoxAround(edge);
    let bBoxWidth;
    let bBoxHeight;
    let midPoint;
    do {
      bBoxAround = grid2.extendBbox(bBoxAround, scaleFactor);
      bBoxWidth = bBoxAround[2] - bBoxAround[0];
      bBoxHeight = bBoxAround[3] - bBoxAround[1];
      midPoint = _midPoint(edge, grid2.rangePoints(bBoxAround), convex2);
      scaleFactor++;
    } while (midPoint === null && (maxSearchArea[0] > bBoxWidth || maxSearchArea[1] > bBoxHeight));
    if (bBoxWidth >= maxSearchArea[0] && bBoxHeight >= maxSearchArea[1]) {
      edgeSkipList.add(keyInSkipList);
    }
    if (midPoint !== null) {
      convex2.splice(i + 1, 0, midPoint);
      grid2.removePoint(midPoint);
      midPointInserted = true;
    }
  }
  if (midPointInserted) {
    return _concave(convex2, maxSqEdgeLen, maxSearchArea, grid2, edgeSkipList);
  }
  return convex2;
}
function hull(pointset, concavity, format$1) {
  let maxEdgeLen = concavity || 20;
  const points = _filterDuplicates(_sortByX(format.toXy(pointset, format$1)));
  if (points.length < 4) {
    const concave2 = points.concat([points[0]]);
    return format$1 ? format.fromXy(concave2, format$1) : concave2;
  }
  const occupiedArea = _occupiedArea(points);
  const maxSearchArea = [
    occupiedArea[0] * MAX_SEARCH_BBOX_SIZE_PERCENT,
    occupiedArea[1] * MAX_SEARCH_BBOX_SIZE_PERCENT
  ];
  const convex2 = convex_1(points);
  const innerPoints = points.filter(function(pt) {
    return convex2.indexOf(pt) < 0;
  });
  const cellSize = Math.ceil(1 / (points.length / (occupiedArea[0] * occupiedArea[1])));
  const concave = _concave(convex2, Math.pow(maxEdgeLen, 2), maxSearchArea, grid_1(innerPoints, cellSize), new Set());
  return format$1 ? format.fromXy(concave, format$1) : concave;
}
const MAX_CONCAVE_ANGLE_COS = Math.cos(90 / (180 / Math.PI));
const MAX_SEARCH_BBOX_SIZE_PERCENT = 0.6;
var hull_1 = hull;
export default hull_1;
