function Point(x, y, id) {
  this.X = x;
  this.Y = y;
  this.ID = id;
  this.IntX = 0;
  this.IntY = 0;
}
function PointFromStorage(x, y, id, intX, intY) {
  this.X = x;
  this.Y = y;
  this.ID = id;
  this.IntX = intX;
  this.IntY = intY;
}
function PointCloud(name, points) {
  this.Name = name;
  this.Points = Resample(points, NumPoints);
  this.Points = Scale(this.Points);
  this.Points = TranslateTo(this.Points, Origin);
  this.Points = MakeIntCoords(this.Points);
  this.LUT = ComputeLUT(this.Points);
}
function PointCloudFromStorage(name, points) {
  this.Name = name;
  this.Points = points;
  this.LUT = ComputeLUT(this.Points);
}
function Result(name, score, ms) {
  this.Name = name;
  this.Score = score;
  this.Time = ms;
}
const NumPointClouds = 16;
const NumPoints = 32;
const Origin = new Point(0, 0, 0);
const MaxIntCoord = 1024;
const LUTSize = 64;
const LUTScaleFactor = MaxIntCoord / LUTSize;
function QDollarRecognizer() {
  this.PointClouds = [];
  this.RecognizeStrokes = function(strokes) {
    let points = [];
    for (const [i, stroke] of strokes.entries()) {
      for (const point of stroke) {
        points.push(new Point(point.x, point.y, i));
      }
    }
    return this.Recognize(points);
  };
  this.RecognizeSorted = function(points) {
    var candidate = new PointCloud("", points);
    var b = Infinity;
    var matches = this.PointClouds.map((pointCloud) => {
      return {
        score: CloudMatch(candidate, pointCloud, b),
        name: pointCloud.Name
      };
    }).sort((a, b2) => {
      return a.score - b2.score;
    });
    return matches;
  };
  this.Recognize = function(points) {
    var t0 = Date.now();
    var candidate = new PointCloud("", points);
    var u = -1;
    var b = Infinity;
    for (var i = 0; i < this.PointClouds.length; i++) {
      var d = CloudMatch(candidate, this.PointClouds[i], b);
      if (d < b) {
        b = d;
        u = i;
      }
    }
    var t1 = Date.now();
    return u == -1 ? new Result("No match.", 0, t1 - t0) : new Result(this.PointClouds[u].Name, b > 1 ? 1 / b : 1, t1 - t0);
  };
  this.AddGestureLoad = function(name, strokes) {
    let points = [];
    for (const [i, stroke] of strokes.entries()) {
      for (const point of stroke) {
        points.push(new Point(point.x, point.y, i));
      }
    }
    return this.AddGesture(name, points);
  };
  this.AddGestureStrokes = function(name, strokes) {
    let convertedPoints = [];
    for (let i = 0; i < strokes.length; i++) {
      const points = strokes[i];
      for (const point of points) {
        convertedPoints.push(new Point(point.x, point.y, i));
      }
    }
    return this.AddGesture(name, convertedPoints);
  };
  this.AddGesture = function(name, points) {
    this.PointClouds[this.PointClouds.length] = new PointCloud(name, points);
    var num = 0;
    for (var i = 0; i < this.PointClouds.length; i++) {
      if (this.PointClouds[i].Name == name)
        num++;
    }
    return num;
  };
  this.DeleteUserGestures = function() {
    this.PointClouds.length = NumPointClouds;
    return NumPointClouds;
  };
}
function CloudMatch(candidate, template, minSoFar) {
  var n = candidate.Points.length;
  var step = Math.floor(Math.pow(n, 0.5));
  var LB1 = ComputeLowerBound(candidate.Points, template.Points, step, template.LUT);
  let LB2 = ComputeLowerBound(template.Points, candidate.Points, step, candidate.LUT);
  for (var i = 0, j = 0; i < n; i += step, j++) {
    if (LB1[j] < minSoFar)
      minSoFar = Math.min(minSoFar, CloudDistance(candidate.Points, template.Points, i, minSoFar));
    if (LB2[j] < minSoFar)
      minSoFar = Math.min(minSoFar, CloudDistance(template.Points, candidate.Points, i, minSoFar));
  }
  return minSoFar;
}
function CloudDistance(pts1, pts2, start, minSoFar) {
  var n = pts1.length;
  var unmatched = new Array();
  for (var j = 0; j < n; j++)
    unmatched[j] = j;
  var i = start;
  var weight = n;
  var sum = 0;
  do {
    var u = -1;
    var b = Infinity;
    for (var j = 0; j < unmatched.length; j++) {
      var d = SqrEuclideanDistance(pts1[i], pts2[unmatched[j]]);
      if (d < b) {
        b = d;
        u = j;
      }
    }
    unmatched.splice(u, 1);
    sum += weight * b;
    if (sum >= minSoFar)
      return sum;
    weight--;
    i = (i + 1) % n;
  } while (i != start);
  return sum;
}
function ComputeLowerBound(pts1, pts2, step, LUT) {
  var n = pts1.length;
  var LB = new Array(Math.floor(n / step) + 1);
  var SAT = new Array(n);
  LB[0] = 0;
  for (var i = 0; i < n; i++) {
    var x = Math.round(pts1[i].IntX / LUTScaleFactor);
    var y = Math.round(pts1[i].IntY / LUTScaleFactor);
    var index = LUT[x][y];
    var d = SqrEuclideanDistance(pts1[i], pts2[index]);
    SAT[i] = i == 0 ? d : SAT[i - 1] + d;
    LB[0] += (n - i) * d;
  }
  for (var i = step, j = 1; i < n; i += step, j++)
    LB[j] = LB[0] + i * SAT[n - 1] - n * SAT[i - 1];
  return LB;
}
function Resample(points, n) {
  var I = PathLength(points) / (n - 1);
  var D = 0;
  var newpoints = new Array(points[0]);
  for (var i = 1; i < points.length; i++) {
    if (points[i].ID == points[i - 1].ID) {
      var d = EuclideanDistance(points[i - 1], points[i]);
      if (D + d >= I) {
        var qx = points[i - 1].X + (I - D) / d * (points[i].X - points[i - 1].X);
        var qy = points[i - 1].Y + (I - D) / d * (points[i].Y - points[i - 1].Y);
        var q = new Point(qx, qy, points[i].ID);
        newpoints[newpoints.length] = q;
        points.splice(i, 0, q);
        D = 0;
      } else
        D += d;
    }
  }
  if (newpoints.length == n - 1)
    newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y, points[points.length - 1].ID);
  return newpoints;
}
function Scale(points) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0; i < points.length; i++) {
    minX = Math.min(minX, points[i].X);
    minY = Math.min(minY, points[i].Y);
    maxX = Math.max(maxX, points[i].X);
    maxY = Math.max(maxY, points[i].Y);
  }
  var size = Math.max(maxX - minX, maxY - minY);
  var newpoints = new Array();
  for (var i = 0; i < points.length; i++) {
    var qx = (points[i].X - minX) / size;
    var qy = (points[i].Y - minY) / size;
    newpoints[newpoints.length] = new Point(qx, qy, points[i].ID);
  }
  return newpoints;
}
function TranslateTo(points, pt) {
  var c = Centroid(points);
  var newpoints = new Array();
  for (var i = 0; i < points.length; i++) {
    var qx = points[i].X + pt.X - c.X;
    var qy = points[i].Y + pt.Y - c.Y;
    newpoints[newpoints.length] = new Point(qx, qy, points[i].ID);
  }
  return newpoints;
}
function Centroid(points) {
  var x = 0, y = 0;
  for (var i = 0; i < points.length; i++) {
    x += points[i].X;
    y += points[i].Y;
  }
  x /= points.length;
  y /= points.length;
  return new Point(x, y, 0);
}
function PathLength(points) {
  var d = 0;
  for (var i = 1; i < points.length; i++) {
    if (points[i].ID == points[i - 1].ID)
      d += EuclideanDistance(points[i - 1], points[i]);
  }
  return d;
}
function MakeIntCoords(points) {
  for (var i = 0; i < points.length; i++) {
    points[i].IntX = Math.round((points[i].X + 1) / 2 * (MaxIntCoord - 1));
    points[i].IntY = Math.round((points[i].Y + 1) / 2 * (MaxIntCoord - 1));
  }
  return points;
}
function ComputeLUT(points) {
  var LUT = new Array();
  for (var i = 0; i < LUTSize; i++)
    LUT[i] = new Array();
  for (var x = 0; x < LUTSize; x++) {
    for (var y = 0; y < LUTSize; y++) {
      var u = -1;
      var b = Infinity;
      for (var i = 0; i < points.length; i++) {
        var row = Math.round(points[i].IntX / LUTScaleFactor);
        var col = Math.round(points[i].IntY / LUTScaleFactor);
        var d = (row - x) * (row - x) + (col - y) * (col - y);
        if (d < b) {
          b = d;
          u = i;
        }
      }
      LUT[x][y] = u;
    }
  }
  return LUT;
}
function SqrEuclideanDistance(pt1, pt2) {
  var dx = pt2.X - pt1.X;
  var dy = pt2.Y - pt1.Y;
  return dx * dx + dy * dy;
}
function EuclideanDistance(pt1, pt2) {
  var s = SqrEuclideanDistance(pt1, pt2);
  return Math.sqrt(s);
}
export default QDollarRecognizer;
