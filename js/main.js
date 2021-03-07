let width = 600,
  height = 600,
  facteurTaille = 20,
  maxEcoute = 80,
  path_recommendations,
  user_songs,
  songs,
  streamingHistory,
  recommendationChart,
  radioChart,
  barChart,
  averageScorePerFeatures,
  features = [
    "danceability",
    "energy",
    "loudness",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "popularity",
    "tempo",
  ],
  streamingHistorySelected = null,
  userSongsSelected = null,
  songsSelected = null;

songSelector = document.getElementById("selectsongindex");
monthSelector = document.getElementById("selectmonthindex");

checkboxInput = document.getElementById("checkbox-input");

filesSelector = document.getElementById("files-selector");
// filesSelector.style.display = "none"; //"flex";
alertBanner = document.getElementById("alert-banner");
alertBanner.style.display = "none";

// file selectors
streamingHistorySelector = document.getElementById("streaming_history");
userSongsJsonSelector = document.getElementById("user_songs_json");
songsJsonSelector = document.getElementById("songs_json");
// file selectors labels
streamingHistoryLabel = document.getElementById("streaming_history_label");
userSongsJsonLabel = document.getElementById("user_songs_json_label");
songsJsonLabel = document.getElementById("songs_json_label");

// button validate
filesSelectorButton = document.getElementById("files-selector-validate");
filesSelectorButton.disabled = true;

streamingHistorySelector.style.backgroundColor = "blue";

filesSelectorButton.addEventListener("click", (event) => {
  if (
    streamingHistorySelected === null ||
    userSongsSelected === null ||
    songsSelected === null
  ) {
    // displayError
    alertBanner.innerHTML =
      "Please, select the different files (StreamingHistory, user_songs_json and songs_json)";
    alertBanner.style.display = "flex";
    console.log("Not all file selected");
  } else {
    try {
      filesSelectorButton.disabled = true;
      alertBanner.style.display = "none";
      // check that uploaded data are correct
      // viz modification
      streamingHistory = streamingHistorySelected;
      user_songs = Object.values(userSongsSelected)
        .sort((a, b) => b.countPerTrack - a.countPerTrack)
        .map((elt) => {
          elt["msPlayedSumTime"] = formatTime(elt["msPlayedSum"]);
          return elt;
        });
      songs = Object.values(songsSelected);

      localStorage.setItem(
        "streamingHistory",
        JSON.stringify(streamingHistory)
      );
      localStorage.setItem("user_songs", JSON.stringify(user_songs));
      localStorage.setItem("songs", JSON.stringify(songs));

      // console.log("streamingHistory", streamingHistory);
      // console.log("user_songs", user_songs);
      // console.log("songs", songs);

      processApp();
      console.log("all file selected, modification of the viz");
    } catch (err) {
      alertBanner.innerHTML =
        "We had some error processing on of the files ! Please try again";
      alertBanner.style.display = "flex";
    }
  }
});

Date.prototype.getWeek = function () {
  var onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
};

function fillSelectorSong(songSelector, values) {
  while (songSelector.hasChildNodes()) {
    songSelector.removeChild(songSelector.lastChild);
  }
  values.forEach((key, index) => {
    let option = document.createElement("option");
    option.value = index;
    option.innerHTML = key.name + " (" + key.countPerTrack + " listenings)";
    songSelector.appendChild(option);
  });
}

function fillSelectorMonth(monthSelector, values) {
  let allMonth = Array.from(
    new Set(
      values.map(function (c) {
        return c["month"];
      })
    )
  );
  while (monthSelector.hasChildNodes()) {
    monthSelector.removeChild(monthSelector.lastChild);
  }
  allMonth.forEach((key) => {
    let option = document.createElement("option");
    option.value = key;
    option.innerHTML = key;
    monthSelector.appendChild(option);
  });
}

songSelector.addEventListener("change", (event) => {
  songIndex = parseInt(event.target.value);
  recommendationChart.changeSong(user_songs[songIndex]);
  radioChart.changeSong(user_songs[songIndex]);
  selectedArtist = user_songs[songIndex]["artist"][0];
  selectedTrack = user_songs[songIndex]["name"];
  barChart.filterMonth(monthSelector.options[parseInt(monthSelector.selectedIndex)].value, calculatedailyListeningTimeArtist(selectedArtist, selectedTrack));
});

monthSelector.addEventListener("change", (event) => {
  song = user_songs[songSelector.options[parseInt(songSelector.selectedIndex)].value];
  selectedArtist = song["artist"][0];
  selectedTrack = song["name"];
  dailyListeningTimeSong = calculatedailyListeningTimeArtist(selectedArtist, selectedTrack);
  monthIndex = parseInt(event.target.value);
  barChart.filterMonth(event.target.value, dailyListeningTimeSong);
});

checkboxInput.addEventListener("change", () => {
  // filesSelector.style.display =
  //   filesSelector.style.display === "none" ? "flex" : "none";
  // si changement checkbox -> on utilise les données si elles sont stockées
  if (filesSelector.style.display === "none") {
    streamingHistoryLabel.innerHTML = "... (streamingHistoryX.json)";
    userSongsJsonLabel.innerHTML = "... (user_songs_json.json)";
    songsJsonLabel.innerHTML = "... (songs_json.json)";
    filesSelector.style.display = "flex";
    if (
      localStorage.getItem("streamingHistory") === null ||
      localStorage.getItem("user_songs") === null ||
      localStorage.getItem("songs") === null
    ) {
      // on affiche les données de base -> on ne fait rien
      console.log("no data stored");
    } else {
      // on affiche les données users grace au localstorage
      buildAppWithUserData();
    }
  } else {
    filesSelector.style.display = "none";
    // on affiche les données de base
    buildAppWithInitialData();
  }
});

function buildRecommendationsPath() {
  let path_recommendations = [];
  let songs_id = songs.map((elt) => elt.id);
  user_songs.forEach((song_user, index_user) => {
    song_user.recommendations.forEach((reco_id) => {
      if (songs_id.indexOf(reco_id) !== -1)
        path_recommendations.push({
          id_user: song_user.id,
          index_user: index_user,
          id_song: reco_id,
          index_song: songs_id.indexOf(reco_id),
          printPath: false,
        });
    });
  });
  return path_recommendations;
}

function formatTime(time) {
  time = time / 1000;
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

function mergeData(selected, notSelected) {
  let result = Array();
  let i = 0;
  if (selected.length > 0) {
    for (var k = 0; k < selected.length; k++) {
      while (notSelected[i]["day"] != selected[k]["day"]) {
        result.push({
          day: notSelected[i]["day"],
          month: notSelected[i]["day"].substring(0, 7),
          notSelected: notSelected[i]["notSelected"],
          selected: 0,
        });
        i += 1;
        if (k > 0) {
          result[i - 1]["selected"] =
            notSelected[i - 1]["day"] == selected[k - 1]["day"]
              ? selected[k - 1]["selected"]
              : 0;
        }
      }
    }
    return result.map(function (c) {
      c["total"] = c["notSelected"];
      return c;
    });
  } else {
    return notSelected.map(function (c) {
      c["total"] = c["notSelected"];
      return c;
    });
  }
}

function calculateAverageScorePerFeatures() {
  let averageScore = {};
  features.forEach((feature) => {
    averageScore[feature] =
      user_songs.map((song) => song[feature]).reduce((a, b) => a + b) /
      user_songs.length;
  });
  //   console.log(averageScore);
  return averageScore;
}

function calculatedailyListeningTimeArtist(selectedArtist, selectedTrack) {
  let artistName = selectedArtist;
  let trackName = selectedTrack;
  let streamingHistorySelected = [].concat(streamingHistory.filter(function (d) {
    return d["artistName"] === artistName && d["trackName"] === trackName;
  }));
  streamingHistoryNotSelected = [].concat(streamingHistory.filter(function (d) {
    if (d["artistName"] === artistName) {
      return d["trackName"] != trackName;
    } else {
      return d;
    }
  }));
  dailyListeningTimeSelected = Array.from(
    d3.rollup(
      streamingHistorySelected,
      (v) => d3.sum(v, (v) => v["msPlayed"]),
      (d) => d["endTime"].substring(0, 10)
    )
  ).map((d) => {
    d["day"] = d[0];
    d["month"] = d[0].substring(0, 7);
    d["selected"] = d[1] / 1000 / 60;
    d["notSelected"] = 0;
    return d;
  });
  dailyListeningTimeNotSelected = Array.from(
    d3.rollup(
      streamingHistoryNotSelected,
      (v) => d3.sum(v, (v) => v["msPlayed"]),
      (d) => d["endTime"].substring(0, 10)
    )
  ).map((d) => {
    d["day"] = d[0];
    d["month"] = d[0].substring(0, 7);
    d["notSelected"] = d[1] / 1000 / 60;
    d["selected"] = 0;
    return d;
  });
  dailyListeningTime = mergeData(
    dailyListeningTimeSelected,
    dailyListeningTimeNotSelected
  );
  return dailyListeningTime;
}

function calculatedailyListeningTime() {
  let artistName = "";
  let trackName = "";
  let streamingHistorySelected = [].concat(streamingHistory.filter(function (d) {
    return d["artistName"] === artistName && d["trackName"] === trackName;
  }));
  streamingHistoryNotSelected = [].concat(streamingHistory.filter(function (d) {
    if (d["artistName"] === artistName) {
      return d["trackName"] != trackName;
    } else {
      return d;
    }
  }));
  dailyListeningTimeSelected = Array.from(
    d3.rollup(
      streamingHistorySelected,
      (v) => d3.sum(v, (v) => v["msPlayed"]),
      (d) => d["endTime"].substring(0, 10)
    )
  ).map((d) => {
    d["day"] = d[0];
    d["month"] = d[0].substring(0, 7);
    d["selected"] = d[1] / 1000 / 60;
    d["notSelected"] = 0;
    return d;
  });
  dailyListeningTimeNotSelected = Array.from(
    d3.rollup(
      streamingHistoryNotSelected,
      (v) => d3.sum(v, (v) => v["msPlayed"]),
      (d) => d["endTime"].substring(0, 10)
    )
  ).map((d) => {
    d["day"] = d[0];
    d["month"] = d[0].substring(0, 7);
    d["notSelected"] = d[1] / 1000 / 60;
    d["selected"] = 0;
    return d;
  });
  dailyListeningTime = mergeData(
    dailyListeningTimeSelected,
    dailyListeningTimeNotSelected
  );
  return dailyListeningTime;
}

function processData() {
  path_recommendations = buildRecommendationsPath();
  averageScorePerFeatures = calculateAverageScorePerFeatures();
  dailyListeningTime = calculatedailyListeningTime();
}

function buildAppWithInitialData() {
  let files = [
    "/data/songs_json.json",
    "/data/user_songs_json.json",
    "/data/StreamingHistory/StreamingHistory0.json",
    "/data/StreamingHistory/StreamingHistory1.json",
  ];
  let promises = files.map((file) => readFile(file));
  Promise.all(promises)
    .then((results) => {
      streamingHistory = results[2].concat(results[3]);
      (user_songs = Object.values(results[1])
        // .slice(0, 200)
        .sort((a, b) => b.countPerTrack - a.countPerTrack) //b.msPlayedSum - a.msPlayedSum)
        .map((elt) => {
          elt["msPlayedSumTime"] = formatTime(elt["msPlayedSum"]);
          return elt;
        })),
        (songs = Object.values(results[0]));
    })
    .then(() => {
      processApp();
    });
}
function buildAppWithUserData() {
  streamingHistory = JSON.parse(localStorage.getItem("streamingHistory"));
  user_songs = JSON.parse(localStorage.getItem("user_songs"));
  songs = JSON.parse(localStorage.getItem("songs"));
  processApp();
}
function buildApp() {
  if (
    localStorage.getItem("streamingHistory") === null ||
    localStorage.getItem("user_songs") === null ||
    localStorage.getItem("songs") === null
  ) {
    filesSelector.style.display = "none";
    checkboxInput.checked = false;
    buildAppWithInitialData();
    console.log("Build initial data app");
  } else {
    filesSelector.style.display = "flex";
    checkboxInput.checked = true;
    buildAppWithUserData();
    console.log("Build personal data app");
  }
}

function processApp() {
  processData();
  fillSelectorSong(songSelector, user_songs);
  fillSelectorMonth(monthSelector, dailyListeningTime);
  buildViz();
}

const selectInputs = document.querySelectorAll('input[type="file"]');
selectInputs.forEach((input) => {
  input.addEventListener(
    "change",
    function (e) {
      Object.keys(input.files).forEach((key) => {
        const reader = new FileReader();
        reader.readAsText(input.files[key]);
        reader.onload = function () {
          try {
            // console.log(input.files[key], JSON.parse(reader.result));
            if (e.target.id === "streaming_history") {
              if (streamingHistorySelected === null) {
                streamingHistorySelected = JSON.parse(reader.result);
              } else {
                streamingHistorySelected = streamingHistorySelected.concat(
                  JSON.parse(reader.result)
                );
              }
              streamingHistoryLabel.innerHTML =
                Object.values(input.files)
                  .map((elt) => elt.name)
                  .join(" - ")
                  .slice(0, 40) + "..";
            } else if (e.target.id === "user_songs_json") {
              userSongsSelected = JSON.parse(reader.result);
              userSongsJsonLabel.innerHTML = input.files[key].name;
            } else if (e.target.id === "songs_json") {
              songsSelected = JSON.parse(reader.result);
              songsJsonLabel.innerHTML = input.files[key].name;
            } else {
              console.log("No id found for this selector");
            }
            if (
              streamingHistorySelected !== null &&
              userSongsSelected !== null &&
              songsSelected !== null
            ) {
              filesSelectorButton.disabled = false;
            } else {
              filesSelectorButton.disabled = true;
            }
            // displayError();
          } catch (err) {
            // displayError();
            // alertBanner.innerHTML =
            // "We had some error reading this file";
            // alertBanner.style.display = "flex";

            console.error(err);
          }
        };
      });
    },
    false
  );
});

function readFile(file) {
  return new Promise(function (resolve, reject) {
    fetch(file).then((response) => resolve(response.json()));
  });
}

function onClickRecommendation(d) {
  songSelector.value = user_songs.indexOf(d);
  radioChart.changeSong(d);
}

function onHoverRecommendation(d) {
  radioChart.hoverSong(d);
}

function onOutedRecommendation(d) {
  radioChart.outedSong(d);
}

function buildViz() {
  recommendationChart = drawRecommendationChart(
    ".recommendation-chart",
    width,
    height,
    facteurTaille,
    maxEcoute,
    path_recommendations,
    user_songs,
    songs,
    onClickRecommendation,
    onHoverRecommendation,
    onOutedRecommendation
  );
  radioChart = drawRadioChart(
    ".radio-chart",
    { top: 75, right: 75, bottom: 75, left: 75 },
    width,
    height,
    "Songs features",
    features,
    averageScorePerFeatures
  );
  barChart = drawBarChart(
    ".bar-chart",
    { top: 20, right: 20, bottom: 75, left: 30 },
    width,
    height,
    "Monthly Listening Time (Min)",
    dailyListeningTime,
    monthSelector.options[parseInt(monthSelector.selectedIndex)].value
  );
}

buildApp();
