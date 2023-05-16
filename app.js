const express = require("express");
const { request } = require("http");
const { waitForDebugger } = require("inspector");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

function playerToCamelCase(item) {
  return {
    playerId: item.player_id,
    playerName: item.player_name,
  };
}

function matchToCamel(item) {
  console.log(item);
  return {
    matchId: item.match_id,
    match: item.match,
    year: item.year,
  };
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(1001, () => {
      console.log("Server is running on http://localhost:1001");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * 
    FROM player_details;`;
  const playerListArray = await db.all(getPlayersQuery);
  //console.log(playerListArray);
  const op = playerListArray.map((eachItem) => {
    return {
      playerId: eachItem.player_id,
      playerName: eachItem.player_name,
    };
  });
  console.log(op);
  response.send(op);
});

// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByPlayerIdQuery = `
  SELECT * 
  FROM player_details
  WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerByPlayerIdQuery);
  //console.log(playerDetails);
  const op = playerToCamelCase(playerDetails);
  //   console.log(op);
  response.send(op);
});

// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerByIdQuery = `
  UPDATE player_details
  SET player_name = '${playerName}'
  WHERE player_id = ${playerId};`;
  await db.run(updatePlayerByIdQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  const getMatchDetailsByMatchIdQuery = `
  SELECT * 
  FROM match_details
  WHERE match_id = ${matchId}`;
  const matchDetails = await db.get(getMatchDetailsByMatchIdQuery);
  const op = matchToCamel(matchDetails);
  //   console.log(op);
  response.send(op);
});

// API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const allMatchesByPlayerIdQuery = `
  SELECT 
    match_id,
    match,
    year
  FROM player_match_score NATURAL JOIN match_details
  WHERE player_id =${playerId}; `;
  const matchDetailsArray = await db.all(allMatchesByPlayerIdQuery);
  console.log(matchDetailsArray);
  const op = matchDetailsArray.map((eachItem) => {
    return {
      matchId: eachItem.match_id,
      match: eachItem.match,
      year: eachItem.year,
    };
  });
  response.send(op);
});

// API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  const getPlayerListQuery = `
  SELECT player_details.player_id, player_details.player_name
  FROM player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
  WHERE match_id = ${matchId};`;
  const array = await db.all(getPlayerListQuery);
  console.log(array);
  const op = array.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(op);
});

// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const getStaticsOfPlayerQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const result = await db.all(getStaticsOfPlayerQuery);
  console.log(result);
  response.send(result);
});

module.exports = app;
