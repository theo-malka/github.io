function drawBarChart(
  container,
  margin,
  width,
  height,
  title,
  dailyListeningTime,
  selectedMonth
) {
  let dailyListeningTimeFiltered = dailyListeningTime.filter(
    (d) => d["month"] === selectedMonth
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

  xScale = d3
    .scaleBand(
      dailyListeningTimeFiltered.map((d) => d.day),
      [margin.left, width - margin.right]
    )
    .padding(0.2);

  yScale = d3.scaleLinear(
    [0, d3.max(dailyListeningTimeFiltered, (d) => d.total)],
    [height - margin.bottom, margin.top]
  );

  xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

  yAxis = d3.axisLeft(yScale);

  stack = d3.stack().keys(["notSelected", "selected"]);

  colors = d3.scaleOrdinal(
    ["notSelected", "selected"],
    ["steelblue", "#FF1493"]
  );

  const chartData = stack(dailyListeningTimeFiltered);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background-color", "#FFFFFF")
    .html("<div>a simple tooltip</div>");

  function formatTime(time) {
    time = time * 60;
    return (
      (parseInt(time / 3600).toString().length === 1
        ? "0" + parseInt(time / 3600)
        : parseInt(time / 3600)) +
      ":" +
      (parseInt((time % 3600) / 60).toString().length === 1
        ? "0" + parseInt((time % 3600) / 60)
        : parseInt((time % 3600) / 60)) +
      ":" +
      (parseInt(time % 60).toString().length === 1
        ? "0" + parseInt(time % 60)
        : parseInt(time % 60))
    );
  }

  function moveTooltip(event) {
    return tooltip
      .style(
        "top",
        (event.pageY > height / 2
          ? event.pageY - tooltip._groups[0][0].clientHeight
          : event.pageY - 10) + "px"
      )
      .style(
        "left",
        (event.pageX < width / 2
          ? event.pageX + 10
          : event.pageX - tooltip._groups[0][0].clientWidth) + "px"
      );
  }

  const groups = svg
    .append("g")
    // Each layer of the stack goes in a group
    // the group contains that layer for all countries
    .selectAll("g")
    .data(chartData)
    .join("g")
    // rects in the same layer will all have the same color, so we can put it on the group
    // we can use the key on the layer's array to set the color
    .style("fill", (d, i) => colors(d.key));

  groups
    .selectAll("rect")
    // Now we place the rects, which are the children of the layer array
    .data((d) => d)
    .join("rect")
    .attr("x", (d) => xScale(d.data.day))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .on("mouseover", function (d) {
      let dataTooltip = d3.select(this)._groups[0][0].__data__.data;
      console.log(dataTooltip);
      tooltip.html(
        "<span>Date : " +
          dataTooltip.day +
          "</span><br><span>Not selected : " +
          formatTime(dataTooltip.notSelected) +
          "</span><br><span>Selected : " +
          formatTime(dataTooltip.selected) +
          "</span>"
      );
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })
    .on("mouseout", function () {
      return tooltip.style("visibility", "hidden");
    });

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "translate(27, 20) rotate (45)");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .select(".domain")
    .remove();

  svg
    .append("text")
    .attr("x", width / 4 + 50)
    .attr("y", height + 10)
    .style("font-size", "20px")
    .style("font-family", "system-ui")
    .text(title);

  function filterMonth(selectedMonth, dailyListeningTimeSong) {
    let dailyListeningTimeFilt = dailyListeningTimeSong.filter(
      (d) => d["month"] === selectedMonth
    );
    svg.selectAll("*").remove();

    xScale = d3
      .scaleBand(
        dailyListeningTimeFilt.map((d) => d.day),
        [margin.left, width - margin.right]
      )
      .padding(0.2);

    yScale = d3.scaleLinear(
      [0, d3.max(dailyListeningTimeFilt, (d) => d.total)],
      [height - margin.bottom, margin.top]
    );

    xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

    yAxis = d3.axisLeft(yScale);

    stack = d3.stack().keys(["notSelected", "selected"]);

    colors = d3.scaleOrdinal(
      ["notSelected", "selected"],
      ["steelblue", "#FF1493"]
    );

    const chartData = stack(dailyListeningTimeFilt);

    const groups = svg
      .append("g")
      // Each layer of the stack goes in a group
      // the group contains that layer for all countries
      .selectAll("g")
      .data(chartData)
      .join("g")
      // rects in the same layer will all have the same color, so we can put it on the group
      // we can use the key on the layer's array to set the color
      .style("fill", (d, i) => colors(d.key));

    groups
      .selectAll("rect")
      // Now we place the rects, which are the children of the layer array
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => xScale(d.data.day))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .on("mouseover", function (d) {
        let dataTooltip = d3.select(this)._groups[0][0].__data__.data;
        console.log(dataTooltip);
        tooltip.html(
          "<span>Date : " +
            dataTooltip.day +
            "</span><br><span>Other songs: " +
            formatTime(dataTooltip.notSelected) +
            "</span><br><span>Selected song : " +
            formatTime(dataTooltip.selected) +
            "</span>"
        );
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        moveTooltip(event);
      })
      .on("mouseout", function () {
        return tooltip.style("visibility", "hidden");
      });

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "translate(27, 20) rotate (45)");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .select(".domain")
      .remove();

    svg
      .append("text")
      .attr("x", width / 4 + 50)
      .attr("y", height + 10)
      .style("font-size", "20px")
      .style("font-family", "system-ui")
      .text(title);

    return;
  }

  return Object.assign(svg.node(), {
    filterMonth: filterMonth,
  });
}
