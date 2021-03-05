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
filesSelector.style.display = "flex"; //"none";
alertBanner = document.getElementById("alert-banner");
alertBanner.style.display = "none";

// file selectors
streamingHistorySelector = document.getElementById("streaming_history");
userSongsJsonSelector = document.getElementById("user_songs_json");
songsJsonSelector = document.getElementById("songs_json");
filesSelectorButton = document.getElementById("files-selector-validate");

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

    // console.log("streamingHistory", streamingHistory);
    // console.log("user_songs", user_songs);
    // console.log("songs", songs);

    processData();
    fillSelectorSong(songSelector, user_songs);
    fillSelectorMonth(monthSelector, dailyListeningTime);
    buildViz();
    console.log("all file selected, modification of the viz");
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
  console.log(user_songs[songIndex]);
  recommendationChart.changeSong(user_songs[songIndex]);
  radioChart.changeSong(user_songs[songIndex]);
});

monthSelector.addEventListener("change", (event) => {
  monthIndex = parseInt(event.target.value);
  barChart.filterMonth(event.target.value);
});

checkboxInput.addEventListener("change", () => {
  filesSelector.style.display =
    filesSelector.style.display === "none" ? "flex" : "none";
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

function calculatedailyListeningTime() {
  let dailyListeningTime = Array.from(
    d3.rollup(
      streamingHistory,
      (v) => d3.sum(v, (v) => v["msPlayed"]),
      (d) => d["endTime"].substring(0, 10)
    )
  ).map((d) => {
    d["user"] = "User1";
    d["day"] = d[0];
    d["month"] = d[0].substring(0, 7);
    d["dayOfWeek"] = new Date(d[0]).getDay();
    d["totalPlayedTimeMin"] = d[1] / 1000 / 60;
    d["totalPlayedTimeMs"] = d[1];
    return d;
  });
  return dailyListeningTime;
}

function processData() {
  path_recommendations = buildRecommendationsPath();
  averageScorePerFeatures = calculateAverageScorePerFeatures();
  dailyListeningTime = calculatedailyListeningTime();
}

function buildApp() {
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
      processData();
      fillSelectorSong(songSelector, user_songs);
      fillSelectorMonth(monthSelector, dailyListeningTime);
      buildViz();
    });
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
            } else if (e.target.id === "user_songs_json") {
              userSongsSelected = JSON.parse(reader.result);
            } else if (e.target.id === "songs_json") {
              songsSelected = JSON.parse(reader.result);
            } else {
              console.log("No id found for this selector");
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
    { top: 75, right: 75, bottom: 75, left: 75 },
    width,
    height,
    "Monthly Listening Time (Min)",
    dailyListeningTime
  );
}

buildApp();
