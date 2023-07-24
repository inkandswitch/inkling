import Vec from "./vec.js";

let geom = {}


geom.inside_polygon = (point, polygon) => {
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i].x, yi = polygon[i].y;
      var xj = polygon[j].x, yj = polygon[j].y;
      
      var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
}

geom.distance_point_line = (point, line) => {
    // Extract the coordinates of the two line points
    const [point1, point2] = line;
    const { x: x1, y: y1 } = point1;
    const { x: x2, y: y2 } = point2;
  
    // Calculate the distance
    const numerator = Math.abs((y2 - y1) * point.x - (x2 - x1) * point.y + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
  
    return numerator / denominator;
}

geom.smallest_distance_between_clusters = (points_a, points_b) => {
    let dist = Vec.dist2(points_a[0], points_b[0])

    for(const point_a of points_a) {
        for(const point_b of points_b) {
            let n_dist = Vec.dist2(point_a, point_b)
            if(n_dist < dist) {
                dist = n_dist
            }
        }
    }

    return Math.sqrt(dist)
}

geom.resample_line = (points, dist=1) => {
    let lengths = geom.compute_line_lengths(points)
    let total_length = lengths[lengths.length-1]

    let resampled_points = []
    for (let i = 0; i < total_length; i+=dist) {
        resampled_points.push(geom.get_point_at_length(lengths, points, i))
    }

    return resampled_points
}

geom.compute_line_lengths = (points) => {
    var lengths = []
    var length_accumulator = 0
    lengths.push(length_accumulator)
    for (let i = 0; i < points.length-1; i++) {
        let length = Vec.len(Vec.sub(points[i+1], points[i]))
        length_accumulator += length
        lengths.push(length_accumulator)
    }
    return lengths
}

geom.get_point_at_length = (lengths, points, length) => {
    if(length <= 0) {
      return points[0]
    }
    
    if(length >= lengths[lengths.count-1]) {
      return points[points.count-1]
    }
    
    let index = lengths.findIndex(i=>i>=length)
    
    
    let start_length = lengths[index-1]
    let end_length = lengths[index]
    
    let t = (length - start_length) / (end_length - start_length)
    
    let start = points[index-1]
    let end = points[index]
    
    return Vec.lerp(start, end, t)
}

geom.normalize_pointcloud_t = (points) => {
    let centroid = geom.get_pointcloud_centroid(points)   
    let centered_points = geom.center_pointcloud(points, centroid)
    return centered_points
}

geom.normalize_pointcloud_ts = (points) => {
    let centroid = geom.get_pointcloud_centroid(points)   
    let centered_points = geom.center_pointcloud(points, centroid)
    return geom.normalize_pointcloud_scale(centered_points)
}

geom.get_pointcloud_centroid = (points) =>{
    let centroid = Vec(0,0)
  
    points.forEach(point=>{
        centroid = Vec.add(centroid, point)
    })
  
    return Vec.divS(centroid, points.length)
}

geom.center_pointcloud = (points, centroid) => {
    return points.map(point=>{
      return Vec.sub(point, centroid)
    })
}

geom.get_strokes_centroid = (strokes) =>{
    let centroid = Vec(0,0)
    
    let length = 0
    strokes.forEach(stroke=>{
        length += stroke.length
        stroke.forEach(point=>{
            centroid = Vec.add(centroid, point)
        })
    })
  
    
    return Vec.divS(centroid, length)
}

geom.center_strokes = (strokes, centroid) => {
    return strokes.map(stroke=>{
        return stroke.map(point=>{
            return Vec.sub(point, centroid)
          })
    })
}


geom.normalize_pointcloud_scale_aspect_ratio = (points) => {
    let largest_x = 0
    let largest_y = 0
  
    points.forEach(point=>{
      let abs_x = Math.abs(point.x)
      let abs_y = Math.abs(point.y)
      if(abs_x > largest_x) largest_x = abs_x
      if(abs_y > largest_y) largest_y = abs_y
    })
  
    let scale = Math.max(largest_x, largest_y)
    let div = Vec(scale, scale)
    return points.map(point=>{
      return Vec.div(point, div)
    })
}

geom.normalize_pointcloud_scale = (points) => {
    let largest = 0
  
    points.forEach(point=>{
      let abs_x = Math.abs(point.x)
      let abs_y = Math.abs(point.y)
      if(abs_x > largest) largest = abs_x
      if(abs_y > largest) largest = abs_y
    })
  
    let div = Vec(largest, largest)
    return points.map(point=>{
      return Vec.div(point, div)
    })
}

geom.pointcloud_covariance_matrix = (points) => {
    const numVertices = points.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
  
    for (let i = 0; i < numVertices; i++) {
        const x = points[i].x;
        const y = points[i].y;
        sumX += x;
        sumY += y;
        sumXX += x * x;
        sumYY += y * y;
        sumXY += x * y;
    }
  
    const covMatrix = [
        [sumXX - sumX * sumX / numVertices, sumXY - sumX * sumY / numVertices],
        [sumXY - sumX * sumY / numVertices, sumYY - sumY * sumY / numVertices],
    ]
  
    return covMatrix
}

geom.pointcloud_overlaps_rect = (points, rect) => {
    let min = rect[0]
    let max = rect[1]
    for(const point of points) {
        if(point.x > min.x 
        && point.y > min.y
        && point.x < max.x
        && point.y < max.y) {
            return true
        }
    }
    return false
}

geom.bounds_for_pointcloud = (points) =>{
    let min = Vec.clone(points[0])
    let max = Vec.clone(points[0])

    points.forEach(point=>{
        if(point.x < min.x) min.x = point.x
        if(point.y < min.y) min.y = point.y
        if(point.x > max.x) max.x = point.x
        if(point.y > max.y) max.y = point.y
    })

    return [min, max]
}

// Computes the squared distance for each point in A, finds the closest point in B
geom.distance_between_pointclouds = (points_a, points_b) => {
    let totalDistance = 0

    if(points_b.length > points_a.length) {
        let c = points_a
        points_a = points_b
        points_b = c
    }
  
    points_a.forEach(ptA=>{
      let minDistance = 10000000000.0
  
      points_b.forEach(ptB=>{
        let dist = Vec.dist2(ptA, ptB)
        if (dist< minDistance) {
          minDistance = dist
        }
      })
  
      totalDistance += minDistance
    })
  
    return totalDistance
}

geom.bounds_overlap = (box1, box2) => {
    // Get the coordinates of the four points defining the two boxes
    const x1 = box1[0].x;
    const y1 = box1[0].y;
    const x2 = box1[1].x;
    const y2 = box1[1].y;
    const x3 = box2[0].x;
    const y3 = box2[0].y;
    const x4 = box2[1].x;
    const y4 = box2[1].y;

    // Check if the boxes overlap in the x-axis
    const xOverlap = Math.max(x1, x2) >= Math.min(x3, x4) && Math.max(x3, x4) >= Math.min(x1, x2);

    // Check if the boxes overlap in the y-axis
    const yOverlap = Math.max(y1, y2) >= Math.min(y3, y4) && Math.max(y3, y4) >= Math.min(y1, y2);

    // Return true if the boxes overlap in both axes
    return xOverlap && yOverlap;
}


geom.point_inside_bounds = (point, rect)=>{
    let min = rect[0]
    let max = rect[1]
    
    return point.x > min.x 
        && point.y > min.y
        && point.x < max.x
        && point.y < max.y
}


export default geom