let width = 500,
  height = 500,
  facteurTaille = 20,
  maxEcoute = 80,
  path_recommendations,
  user_songs,
  songs,
  streamingHistory,
  recommendationChart,
  averageScorePerFeatures,
  countPerArtist,
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
  ];

songSelector = document.getElementById("selectsongindex");

function fillSelector(songSelector, values) {
  while (songSelector.hasChildNodes()) {
    songSelector.removeChild(songSelector.lastChild);
  }
  values.forEach((key, index) => {
    let option = document.createElement("option");
    option.value = index;
    option.innerHTML = key.name;
    songSelector.appendChild(option);
  });
}

songSelector.addEventListener("change", (event) => {
  songIndex = parseInt(event.target.value);
  recommendationChart.changeSong(user_songs[songIndex]);
});

// let chartDiv = document.getElementById("chart-div");
// chartDiv.setAttribute("width", width);
// chartDiv.setAttribute("height", height);

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
  console.log(averageScore);
  return averageScore;
}

function calculateCountPerArtist() {
  let countPerArtist = user_songs
    .map((song) => {
      return song.countPerTrack > 30
        ? { name: song.name, value: song.countPerTrack }
        : null;
    })
    .filter((elt) => elt !== null);
  return countPerArtist;
}

function processData() {
  path_recommendations = buildRecommendationsPath();
  averageScorePerFeatures = calculateAverageScorePerFeatures();
  countPerArtist = calculateCountPerArtist();
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
        .sort((a, b) => b.msPlayedSum - a.msPlayedSum)
        .map((elt) => {
          elt["msPlayedSumTime"] = formatTime(elt["msPlayedSum"]);
          return elt;
        })),
        (songs = Object.values(results[0]));
    })
    .then(() => {
      console.log(user_songs);
      //   console.log(streamingHistory, user_songs, songs);
      processData();
      fillSelector(songSelector, user_songs);
      buildViz();
    });
}

function readFile(file) {
  return new Promise(function (resolve, reject) {
    fetch(file).then((response) => resolve(response.json()));
  });
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
    songs
  );
  drawRadioChart(
    ".radio-chart",
    { top: 100, right: 100, bottom: 100, left: 100 },
    width,
    height,
    "Average scores",
    features,
    averageScorePerFeatures
  );

  drawPieChart(".pie-chart", width, height, countPerArtist);
}

buildApp();
