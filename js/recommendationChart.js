function drawRecommendationChart(
  container,
  width,
  height,
  facteurTaille,
  maxEcoute,
  path_recommendations,
  user_songs,
  songs,
  onClick
) {
  const totalWidth = facteurTaille * width,
    totalHeight = facteurTaille * height;

  d3.select(container).selectAll("*").remove();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [
      -totalWidth / 2,
      -totalHeight / 2,
      totalWidth,
      totalHeight,
    ]);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background-color", "#FFFFFF")
    .html("<div>a simple tooltip</div>");

  function moveTooltip(event) {
    return tooltip
      .style(
        "top",
        (event.pageY > totalHeight / 2
          ? event.pageY - tooltip._groups[0][0].clientHeight
          : event.pageY - 10) + "px"
      )
      .style(
        "left",
        (event.pageX < totalWidth / 2
          ? event.pageX + 10
          : event.pageX - tooltip._groups[0][0].clientWidth) + "px"
      );
  }

  // x and y are scales that project the data space to the ‘unzoomed’ pixel referential
  const x = d3.scaleLinear([-1, 1], [-totalWidth, totalWidth]);
  const y = d3.scaleLinear([-1, 1], [-totalHeight, totalHeight]);
  const r = d3.scaleLinear([0, 1], [10, 20]);
  const nbecoutes = d3.scaleLinear([0, maxEcoute], [20, 50]);

  const g = svg.append("g");

  const colorHilightedCircle = "yellow";
  const scale = d3.scaleOrdinal(d3.schemeCategory10);

  function color(d) {
    return scale(d.kmeans_cluster);
  }

  g.selectAll("song_circle")
    .data(songs)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", (d) => r(d.popularity))
    .attr("fill", (d) => {
      //   console.log(color(d));
      return color(d);
    })
    .attr("opacity", 0.7)
    .attr("stroke", "black")
    // .attr("data-legend",function(d) { return d.color})
    .on("mouseover", function (event, d) {
      tooltip.html(`
                    <div style = "border:2px solid;"> 
                        <b> Title :</b> ${d.name}  <br> 
                        <b> Album :</b> ${d.album} <br> 
                        <b> Artist :</b>  ${d.artists.join(" feat ")} <br>
                        ${[
                          "danceability",
                          "energy",
                          "loudness",
                          "speechiness",
                          "acousticness",
                          "instrumentalness",
                          "liveness",
                          "valence",
                          "tempo",
                          "popularity",
                        ]
                          .map((feature) => {
                            return `<b> ${
                              feature[0].toUpperCase() +
                              feature.slice(1, feature.length)
                            } :</b> ${d[feature]} <br>`;
                          })
                          .join(" ")}
                </div>
                `);
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })

    .on("mouseout", function (event, d) {
      return tooltip.style("visibility", "hidden");
    });

  function getPathFromSongId(id_song, id_user) {
    return path_recommendations.filter(
      (reco) => reco.id_song === id_song && reco.id_user === id_user
    );
  }

  var highlighterdUserPoint = user_songs[0].name;

  const userPoints = g
    .selectAll("user_circle")
    .data(user_songs)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", (d) => nbecoutes(d.countPerTrack))
    .attr("fill", (d) =>
      highlighterdUserPoint === d.name ? "magenta" : "white"
    )
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .on("click", function (event, d) {
      onClick(d);
      svg
        .selectAll("path")
        .select(function (dline, idx) {
          if (dline && dline.id_user == d.id) {
            dline["printPath"] = !dline["printPath"];
            return this;
          } else {
            return null;
          }
        })
        .attr("stroke-width", 10)
        .attr("stroke", (d) => color(songs[d.index_song]))
        .style("visibility", "visible");

      svg
        .selectAll("circle")
        .select(function (dcircle, idx) {
          return d.recommendations.indexOf(dcircle.id) !== -1 &&
            dcircle.recommendations === undefined
            ? this
            : null;
        })
        .attr("fill", (dcircle) =>
          getPathFromSongId(dcircle.id, d.id)[0].printPath
            ? colorHilightedCircle
            : color(dcircle)
        );
    })
    .on("mouseover", function (event, d) {
      tooltip.html(`
                    <div style = "border:2px solid;"> 
                        <b> Title :</b> ${d.name}  <br> 
                        <b> Album :</b> ${d.album} <br> 
                        <b> Artist :</b>  ${d.artist.join(" feat ")} <br>
                        ${[
                          "danceability",
                          "energy",
                          "loudness",
                          "speechiness",
                          "acousticness",
                          "instrumentalness",
                          "liveness",
                          "valence",
                          "tempo",
                          "popularity",
                          "countPerTrack",
                          "msPlayedSumTime",
                        ]
                          .map((feature) => {
                            return `<b> ${
                              feature[0].toUpperCase() +
                              feature.slice(1, feature.length)
                            } :</b> ${d[feature]} <br>`;
                          })
                          .join(" ")}
                </div>
                `);
      userSongOvered(event, d);
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })

    .on("mouseout", function (event, d) {
      userSongOuted(event, d);
      return tooltip.style("visibility", "hidden");
    });

  const curve = d3.line().curve(d3.curveBasis);

  g.selectAll("lines")
    .data(path_recommendations)
    .join("path")
    .attr("d", (d) => {
      return curve([
        [x(user_songs[d.index_user]["x"]), y(user_songs[d.index_user]["y"])],

        [x(user_songs[d.index_user]["x"]), y(songs[d.index_song]["y"])],

        [x(songs[d.index_song]["x"]), y(songs[d.index_song]["y"])],
      ]);
    })
    .attr("stroke", (d) => color(songs[d.index_song]))
    .attr("fill", "none")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 3)
    .style("visibility", "hidden")
    .on("mouseover", lineOvered)
    .on("mousemove", function (event) {
      moveTooltip(event);
    })
    .on("mouseout", lineOuted);

  function lineOvered(event, d) {
    d3.select(this).attr("stroke-width", 10).attr("stroke", "blue");
    let user_song = user_songs.filter((elt) => elt.id === d.id_user)[0];
    let reco_song = songs.filter((elt) => elt.id === d.id_song)[0];
    tooltip.html(`
                    <div style = "border:2px solid;"> 
                        <b> My song :</b> <br> ${
                          user_song.name
                        } <br>  ${user_song.artist.join(" feat ")} <br> 
                        <b> Recommended song :</b> <br> ${
                          reco_song.name
                        } <br> ${reco_song.artists.join(" feat ")}<br> 
                        
                </div>
                `);
    return tooltip.style("visibility", "visible");
  }

  function lineOuted(event, d) {
    d3.select(this)
      .attr("stroke-width", 10)
      .attr("stroke", (d) => color(songs[d.index_song]));
    return tooltip.style("visibility", "hidden");
  }

  function userSongOvered(event, d) {
    svg
      .selectAll("circle")
      .select(function (dcircle, idx) {
        return dcircle.id === d.id ? this : null;
      })
      .attr("fill", (d) =>
        highlighterdUserPoint === d.name ? "magenta" : colorHilightedCircle
      );
    svg
      .selectAll("path")
      .select(function (dline, idx) {
        return dline && dline.id_user == d.id ? this : null;
      })
      .attr("stroke-width", 10)
      .attr("stroke", (d) => color(songs[d.index_song]))
      .style("visibility", "visible");
  }

  function userSongOuted(event, d) {
    svg
      .selectAll("circle")
      .select(function (dcircle, idx) {
        return dcircle.id === d.id ? this : null;
      })
      .attr("fill", (d) =>
        highlighterdUserPoint === d.name ? "magenta" : "white"
      );
    svg
      .selectAll("path")
      .select(function (dline, idx) {
        return dline && dline.id_user == d.id && !dline["printPath"]
          ? this
          : null;
      })
      .attr("stroke-width", 3)
      .attr("stroke", (d) => color(songs[d.index_song]))
      .style("visibility", "hidden");
  }

  legend = (svg) => {
    /*
        cluster1 : en haut à droite
        cluster 2 en basa gauche
        cluster3 en haut à gauche
        cluster 4 en base à droite
        
        axe des x : utilisation d'appareil électronique ou non, musique acoustique à droite vs musique moderne à gauche
        
        axe des y : musique avec instrument ou sans instrument
        
        */

    const cluster_data = [
      "Acoustique instrumentale",
      "Moderne instrumentale",
      "Moderne sans instruments",
      "Acoustique sans instruments",
    ];
    const xLegend = -1300;

    const g = svg
      .attr(
        "transform",
        `translate(${(facteurTaille * width) / 2 + xLegend},${
          (-facteurTaille * height) / 2 + 50
        })`
      )
      .attr("text-anchor", "start")
      .attr("font-family", "sans-serif")
      .attr("font-size", 160)
      .selectAll("g")
      .data(
        [0, 1, 2, 3].map((elt) => ({
          title: cluster_data[elt],
          kmeans_cluster: elt,
        }))
      )
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * 120})`);

    g.append("rect")
      .attr("x", xLegend)
      .attr("width", 120)
      .attr("height", 120)
      .attr("fill", color);

    g.append("text")
      .attr("x", xLegend + 130)
      .attr("y", 20)
      .attr("dy", "0.5em")
      .text((d) => d.title);
  };

  let transform;

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 40])
    .on("zoom", (e) => {
      g.attr("transform", (transform = e.transform));
    });

  svg.call(zoom);

  function changeSong(song) {
    transform = { k: r(song.popularity), x: x(song.x), y: y(song.y) };
    highlighterdUserPoint = song.name;
    userPoints.attr("fill", (d) =>
      highlighterdUserPoint === d.name ? "magenta" : "white"
    );
    svg
      .transition()
      .duration(500)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(0, 0)
          .scale(transform.k)
          .translate(-transform.x, -transform.y)
      );
  }

  svg.append("g").call(legend);

  return Object.assign(svg.node(), {
    changeSong: changeSong,
  });
}
