function drawPieChart(container, width, height, countPerArtistMod) {
  pie = d3
    .pie()
    .sort(null)
    .value((d) => d.value);

  arcLabel = () => {
    const radius = (Math.min(width, height) / 2) * 0.8;
    return d3.arc().innerRadius(radius).outerRadius(radius);
  };

  arc = d3
    .arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1);

  piecolor = d3
    .scaleOrdinal()
    .domain(countPerArtistMod.map((d) => d.name))
    .range(
      d3
        .quantize(
          (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
          countPerArtistMod.length
        )
        .reverse()
    );

  const arcs = pie(countPerArtistMod);

  d3.select(container).selectAll("*").remove();
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  svg
    .append("g")
    .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", (d) => piecolor(d.data.name))
    .attr("d", arc)
    .append("title")
    .text((d, i) => `${d.data.name}: ${d.data.value}`);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 9)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("transform", (d) => `translate(${arcLabel().centroid(d)})`)
    .call((text) =>
      text
        .append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text((d) => d.data.name)
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text((d) => d.data.value)
    );

  return svg.node();
}
