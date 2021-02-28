function drawBarChart(
  container,
  margin,
  width,
  height,
  title,
  dailyListeningTime
) {
  let dailyListeningTimeFiltered = dailyListeningTime.filter(
    (d) => d["month"] === "2020-12"
  );

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

  const g = svg.append("g").attr("transform", "translate(80 0)");

  let x = d3
    .scaleBand()
    .domain(Array.from(dailyListeningTimeFiltered).map((d) => d["day"]))
    .range([0, width])
    .padding(0.2);

  let y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(dailyListeningTimeFiltered, (d) => d["totalPlayedTimeMin"]),
    ])
    .range([height, 0]);

  let yAxis = (g) => g.call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(dailyListeningTimeFiltered)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d["day"]))
    .attr("y", (d) => height - y(d["totalPlayedTimeMin"]))
    .attr("width", (d) => x.bandwidth())
    .attr("height", (d) => y(d["totalPlayedTimeMin"]))
    .style("fill", "steelblue");

  g.selectAll("text")
    .data(dailyListeningTimeFiltered)
    .enter()
    .append("text")
    .attr("x", (d) => x(d["day"]))
    .attr("y", (d) => width)
    .attr(
      "transform",
      (d) =>
        "translate(" +
        x.bandwidth() / 4 +
        " " +
        10 +
        ") rotate(45 " +
        x(d["day"]) +
        ", " +
        height +
        ")"
    )
    .text((d) => d["day"]);

  g.append("text")
    .attr("x", width / 3 + 30)
    .attr("y", height + 90)
    .style("font-size", "20px")
    .style("font-family", "system-ui")
    .text(title);

  g.append("g").call(yAxis);

  function filterMonth(selectedMonth) {
    let dailyListeningTimeFilt = dailyListeningTime.filter(
      (d) => d["month"] === selectedMonth
    );

    g.selectAll("*").remove();

    x = d3
      .scaleBand()
      .domain(Array.from(dailyListeningTimeFilt).map((d) => d["day"]))
      .range([0, width])
      .padding(0.2);

    y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(dailyListeningTimeFilt, (d) => d["totalPlayedTimeMin"]),
      ])
      .range([height, 0]);

    yAxis = (g) => g.call(d3.axisLeft(y));

    g.selectAll("rect")
      .data(dailyListeningTimeFilt)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d["day"]))
      .attr("y", (d) => height - y(d["totalPlayedTimeMin"]))
      .attr("width", (d) => x.bandwidth())
      .attr("height", (d) => y(d["totalPlayedTimeMin"]))
      .style("fill", "steelblue");

    g.selectAll("text")
      .data(dailyListeningTimeFilt)
      .enter()
      .append("text")
      .attr("x", (d) => x(d["day"]))
      .attr("y", (d) => width)
      .attr(
        "transform",
        (d) =>
          "translate(" +
          x.bandwidth() / 4 +
          " " +
          10 +
          ") rotate(45 " +
          x(d["day"]) +
          ", " +
          height +
          ")"
      )
      .text((d) => d["day"]);
    
    g.append("text")
        .attr("x", width / 3 + 30)
        .attr("y", height + 90)
        .style("font-size", "20px")
        .style("font-family", "system-ui")
        .text(title);

    g.append("g").call(yAxis);

    return;
  }

  return Object.assign(svg.node(), {
    filterMonth: filterMonth,
  });
}
