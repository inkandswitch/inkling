const Arc = (center, radius, startAngle, endAngle) => {
    return {center, radius, startAngle, endAngle}
}
export default Arc

Arc.len = (arc) => {
    let {radius, startAngle, endAngle} = arc;
    // Convert angles from degrees to radians
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    // Calculate the arc length using the formula: arc length = radius * angle
    const length = radius * Math.abs(endAngleRad - startAngleRad);
    
    // Return the arc length
    return length;
}

Arc.point_circle_distance = (point, circle) => {
    let {x, y} = point
    let circleX = circle.center.x
    let circleY = circle.center.y
    let radius = circle.radius

    // Calculate the distance between the point and the center of the circle
    const distance = Math.sqrt((x - circleX) ** 2 + (y - circleY) ** 2);
    
    // Subtract the radius from the distance to get the shortest distance from the point to the circle's circumference
    const shortestDistance = distance - radius;
    
    // Return the absolute value of the shortest distance (to make sure it's positive)
    return Math.abs(shortestDistance);
}