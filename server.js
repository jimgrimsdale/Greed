function handleHTTP(req,res) {
  if (req.method == "GET") {
    switch(req.url) {
      case '/game':
        req.url = '/game.html';
        break;
      case '/restartgame': 
        resetGame();
        req.url = '/game.html';        
    }
    static_files.serve(req, res);
  }
  else {
    res.writeHead(403);
    res.end();
  }
}

var game; 
var dice = [
  {
    elementId: '#dice0',
    value: 0,
    inPlay: true,
    justRolled: false
  },
  {
    elementId: '#dice1',
    value: 0,
    inPlay: true,
    justRolled: false
  },
  {
    elementId: '#dice2',
    value: 0,
    inPlay: true,
    justRolled: false
  },
  {
    elementId: '#dice3',
    value: 0,
    inPlay: true,
    justRolled: false
  },
  {
    elementId: '#dice4',
    value: 0,
    inPlay: true,
    justRolled: false
  },
  {
    elementId: '#dice5',
    value: 0,
    inPlay: true,
    justRolled: false
  }
];
var currentPlayer;
var gameCreatedTimeStamp;

function resetGame() {
  game = undefined;
  resetDice();
  gameCreatedTimeStamp = undefined;
}

function connection(socket) {
  function disconnect() {
    console.log("disconnected");
  }

  function getStatus(userId) {
    if(!game) {
      socket.emit("statusUpdate", "createGame");
      return;
    } 
    if(game.numberOfPlayers !== game.players.length) {
      socket.emit("statusUpdate", "registering");
      return;
    } else {
      var minutesSinceGameCreated = !gameCreatedTimeStamp ? 0 : Math.floor(((Date.now() - gameCreatedTimeStamp) / 1000) / 60);
      socket.emit("statusUpdate", "inprogress", null, minutesSinceGameCreated);
    }
    // if(!userId) {
    //   socket.emit("statusUpdate", "game");
    // }
  }

  function restartGame() {
    resetGame();
  }

  function createGame(finalScoreLine, numberOfPlayers) {
    game = {
      numberOfPlayers: numberOfPlayers,
      players: [],
      round: 1,
      finalScoreLine: finalScoreLine
    };

    io.sockets.emit("statusUpdate", "registering");

    gameCreatedTimeStamp = Date.now();
  }

  function register(data) {
    var playerNumber = game.players.length + 1;
    data.playerNumber = playerNumber;
    data.totalTurnScore = 0;
    data.totalScore = 0;

    game.players.push(data);
    if (game.players.length === game.numberOfPlayers) {
      currentPlayer = game.players[0];
      io.sockets.emit("statusUpdate", "startGame", game);
    } else {
      socket.emit("statusUpdate", "registered");
    }
  }

  function roll() {
    diceRoller.resetJustRolledAndDeselected(dice);
    diceRoller.checkAllNotInPlay(dice);
    diceRoller.rollDiceInPlay(dice);
    scoreCalculator.calculateScoresForEachDice(dice);
    var turnScore = scoreCalculator.calculateTurnScore(dice);
    currentPlayer.totalTurnScore = turnScore === 0 ? 0 : currentPlayer.totalTurnScore + turnScore;

    var diceData = {
      dice: dice,
      turnScore: turnScore,
      totalTurnScore: currentPlayer.totalTurnScore,
      currentPlayerName: currentPlayer.name,
      totalScore: currentPlayer.totalScore + currentPlayer.totalTurnScore
    };

    io.sockets.emit("rolled", diceData);
  }

  function updateScores(diceNumber, oldTurnScore, deselected) {
    var die = dice[diceNumber];
    die.deselected = deselected;
    die.inPlay = true;
    checkIf3ofAKind(die, deselected);
    resetWins();
    scoreCalculator.calculateScoresForEachDice(dice);
    var turnScore = scoreCalculator.calculateTurnScore(dice);

    currentPlayer.totalTurnScore = currentPlayer.totalTurnScore - oldTurnScore + turnScore;

    var diceData = {
      dice: dice,
      turnScore: turnScore,
      totalTurnScore: currentPlayer.totalTurnScore,
      currentPlayerName: currentPlayer.name,
      totalScore: currentPlayer.totalScore + currentPlayer.totalTurnScore
    };

    io.sockets.emit("updatedScores", diceData);
  }

  function checkIf3ofAKind(die, deselected) {
    var win = die.win;
    if (deselected && (win === "3 of a kind" || win === "3ofakind") && die.value !== 1 && die.value !== 5) {
      dice.forEach(function(die) {
        if (die.win === win) {
          die.deselected = true;
          die.inPlay = true;
        }
      });
    }
  }

  function resetWins() {
    dice.forEach(function(die) {
      die.win = undefined;
      die.score = undefined;
    });
  }

  function endGo() {
    var gameEndTotalScore = 0,
      winner;
    currentPlayer.totalScore += currentPlayer.totalTurnScore;
    if (game.finalRound && game.finalRoundTurnsLeft) {
      game.finalRoundTurnsLeft--;
      if(game.finalRoundTurnsLeft === 0) {
        game.players.forEach(function(player) {
          if (player.totalScore === gameEndTotalScore && player.name !== game.firstPastFinalScoreLine) {
            winner += " and " + player.name;
          }
          if (player.totalScore === gameEndTotalScore && player.name === game.firstPastFinalScoreLine) {
            winner = game.firstPastFinalScoreLine;
          }
          if (player.totalScore > gameEndTotalScore) {
            gameEndTotalScore = player.totalScore;
            winner = player.name;
          }          
        }); 
      }
    }
    if (!game.finalRound && currentPlayer.totalScore >= game.finalScoreLine) {
      game.finalRound = true;
      game.finalRoundTurnsLeft = game.players.length - 1;
      game.firstPastFinalScoreLine = currentPlayer.name;
    }
    var prevPlayerTotalTurnScore = currentPlayer.totalTurnScore;
    var prevPlayerTotalScore = currentPlayer.totalScore;
    var prevPlayerNumber = currentPlayer.playerNumber;
    var prevPlayerName = currentPlayer.name;

    currentPlayer.totalTurnScore = 0;

    if (currentPlayer.playerNumber === game.players.length) {
      currentPlayer = game.players[0];
    } else {
      currentPlayer = game.players[currentPlayer.playerNumber];
    }
    
    resetDice();

    var endOfRound = prevPlayerNumber === game.players.length;
    if (endOfRound) {
      game.round++;
    }

    var data = {
      name: currentPlayer.name,
      totalScore: currentPlayer.totalScore,
      prevPlayerNumber: prevPlayerNumber,
      prevPlayerTotalTurnScore: prevPlayerTotalTurnScore,
      prevPlayerTotalScore: prevPlayerTotalScore,
      prevPlayerName: prevPlayerName,
      endOfRound: endOfRound,
      round: game.round,
      numberOfPlayers: game.players.length,
      winner: winner
    };

    io.sockets.emit("nextPlayersTurn", data);

    if (winner) {
      resetGame();
    }
  }

  socket.on("disconnect", disconnect);
  socket.on("getStatus", getStatus);
  socket.on("createGame", createGame);
  socket.on("register", register);
  socket.on("roll", roll);
  socket.on("updateScores", updateScores);
  socket.on("restartGame", restartGame);
  socket.on("endGo", endGo);
}

function resetDice() {
  dice.forEach(function(die) {
    die.value = 0;
    die.inPlay = true;
    die.justRolled = false;
    die.win = undefined;
    die.score = undefined;
  });
}

var diceRoller = require('./greed_node_modules/diceRoller.js');
var scoreCalculator = require('./greed_node_modules/scoreCalculator.js');

var http = require("http"),
  httpserv = http.createServer(handleHTTP),
  port = process.env.OPENSHIFT_NODEJS_PORT || 8006,
  // host = "127.0.0.1",
  host = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0",
  node_static = require("node-static"),
  static_files = new node_static.Server(__dirname),
  io = require("socket.io").listen(httpserv);

// configure socket.io
io.configure(function(){
  io.enable("browser client minification"); // send minified client
  io.enable("browser client etag"); // apply etag caching logic based on version number
  io.set("log level", 1); // reduce logging
  io.set("transports", [
    "websocket",
    "xhr-polling",
    "jsonp-polling"
  ]);
});

httpserv.listen(port, host);

io.on("connection", connection);