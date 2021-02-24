function drawRadioChart(
  container,
  margin,
  width,
  height,
  title,
  features,
  averageScorePerFeatures
) {
  d3.select(container).selectAll("*").remove();
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ]);

  let center = { x: width / 2 + margin.left, y: height / 2 + margin.top };

  svg
    .append("text")
    .attr("x", center.x)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(title);

  let radialScale = d3.scaleLinear().domain([0, 1]).range([0, 250]);
  let ticks = [0.2, 0.4, 0.6, 0.8, 1];

  ticks.forEach((t) =>
    svg
      .append("circle")
      .attr("cx", center.x)
      .attr("cy", center.y)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("r", radialScale(t))
  );

  function angleToCoordinate(angle, value) {
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    return { x: center.x + x, y: center.y - y };
  }

  function angleToTextCoordinate(angle, value) {
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    if (x < 0) {
      x -= radialScale(0.15);
    }
    return { x: center.x + x, y: center.y - y };
  }

  for (var i = 0; i < features.length; i++) {
    let ft_name = features[i];
    let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
    let line_coordinate = angleToCoordinate(angle, 1);
    let label_coordinate = angleToTextCoordinate(angle, 1.1);

    //draw axis line
    svg
      .append("line")
      .attr("x1", center.x)
      .attr("y1", center.y)
      .attr("x2", line_coordinate.x)
      .attr("y2", line_coordinate.y)
      .attr("stroke", "black");

    //draw axis label
    svg
      .append("text")
      .attr("x", label_coordinate.x)
      .attr("y", label_coordinate.y)
      .attr("font-size", 10)
      .text(ft_name);
  }

  let line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);

  function getPathCoordinates(data_point) {
    let coordinates = [];
    for (var i = 0; i < features.length; i++) {
      let ft_name = features[i];
      let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
      coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
    }
    return coordinates;
  }

  let coordinates = getPathCoordinates(averageScorePerFeatures);

  coordinates.push(coordinates[0]);

  //draw the path element
  svg
    .append("path")
    .datum(coordinates)
    .transition()
    .ease(d3.easeLinear)
    .duration(200)
    .attr("d", line)
    .attr("stroke-width", 3)
    .attr("stroke", "#0000FF")
    .attr("fill", "#3333AA")
    .attr("stroke-opacity", 1)
    .attr("opacity", 0.5);

  return svg.node();
}
