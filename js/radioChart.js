function drawRadioChart(
  container,
  margin,
  width,
  height,
  title,
  features,
  averageScorePerFeatures
) {
  let pcaEigenVectors = [
    [
      -0.14530892,
      -0.45164598,
      -0.17922085,
      0.01960184,
      0.71010892,
      -0.0491576,
      -0.07115688,
      -0.4733142,
      -0.07960588,
      0.01729172,
    ],
    [
      0.23709846,
      -0.07054986,
      -0.03171221,
      0.07658478,
      0.50155709,
      -0.19860144,
      -0.06383221,
      0.79601205,
      -0.03163607,
      -0.04715422,
    ],
  ];

  d3.select(container).selectAll("*").remove();
  const svgRadioChart = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ]);

  let center = { x: width / 2 + margin.left, y: height / 2 + margin.top };

  svgRadioChart
    .append("text")
    .attr("x", center.x)
    .attr("y", margin.top / 3)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-family", "system-ui")
    .text(title);

  let radialScale = d3.scaleLinear().domain([0, 1]).range([0, 250]);
  let ticks = [0.2, 0.4, 0.6, 0.8, 1];

  ticks.forEach((t) =>
    svgRadioChart
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
    svgRadioChart
      .append("line")
      .attr("x1", center.x)
      .attr("y1", center.y)
      .attr("x2", line_coordinate.x)
      .attr("y2", line_coordinate.y)
      .attr("stroke", "black");

    //draw axis label
    svgRadioChart
      .append("text")
      .attr("x", label_coordinate.x)
      .attr("y", label_coordinate.y)
      .attr("font-size", 14)
      .style("font-family", "system-ui")
      .text(ft_name);
  }

  let line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);

  function getPathCoordinates(data_point) {
    let coordinates = [];
    // console.log(data_point);
    for (var i = 0; i < features.length; i++) {
      let ft_name = features[i];
      let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
      coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
    }
    coordinates.push(coordinates[0]);
    return coordinates;
  }

  function hoverSong(song) {
    let songScore = {};
    features.forEach((feature) => {
      songScore[feature] = song[feature];
    });

    let songCoordinates = getPathCoordinates(songScore);

    svgRadioChart
      .append("path")
      .datum(songCoordinates)
      .transition()
      .ease(d3.easeLinear)
      .duration(200)
      .attr("d", line)
      .attr("stroke-width", 3)
      .attr("stroke", "#1956ff")
      .attr("fill", "#36b3ff")
      .attr("stroke-opacity", 1)
      .attr("opacity", 0.4)
      .attr("id", "onhoverpath");
  }

  function outedSong() {
    svgRadioChart.select("#onhoverpath").remove();
    // console.log(svgRadioChart.selectAll("path"));
  }

  function changeSong(song) {
    let songScore = {};
    features.forEach((feature) => {
      songScore[feature] = song[feature];
    });

    let songCoordinates = getPathCoordinates(songScore);

    svgRadioChart.selectAll("path").remove();

    svgRadioChart
      .append("path")
      .datum(songCoordinates)
      .transition()
      .ease(d3.easeLinear)
      .duration(200)
      .attr("d", line)
      .attr("stroke-width", 3)
      .attr("stroke", "#195607")
      .attr("fill", "#36b310")
      .attr("stroke-opacity", 1)
      .attr("opacity", 0.4);

    drawAveragePath();
  }

  let averageCoordinates = getPathCoordinates(averageScorePerFeatures);

  function drawAveragePath() {
    //draw the average path element
    svgRadioChart
      .append("path")
      .datum(averageCoordinates)
      .transition()
      .ease(d3.easeLinear)
      .duration(200)
      .attr("d", line)
      .attr("stroke-width", 3)
      .attr("stroke", "#0000FF")
      .attr("fill", "#3333AA")
      .attr("stroke-opacity", 1)
      .attr("opacity", 0.4);
  }

  drawAveragePath();

  return Object.assign(svgRadioChart.node(), {
    changeSong: changeSong,
    hoverSong: hoverSong,
    outedSong: outedSong,
  });
}
