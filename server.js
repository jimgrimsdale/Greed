function handleHTTP(req,res) {
  if (req.method == "GET") {
    if (req.url === '/game') {
      req.url = '/game.html';
      static_files.serve(req, res);
    } else {
      static_files.serve(req, res);
    }
    
    // if (req.url === '/game') {
    //   req.url = '/game.html';
    //   static_files.serve(req, res);
    // } else
    // if (/^\/\d+(?=$|[\/?#])/.test(req.url)) {
    //   req.addListener("end",function(){
    //     req.url = req.url.replace(/^\/(\d+).*$/,"/$1.html");
    //     console.log(req.url);
    //     static_files.serve(req,res);
    //   });
    //   req.resume();
    // }
    // else if (req.url === "/lib/jquery.js" || req.url === "/lib/handlebars-v4.0.5.js") {
    //   req.addListener("end",function(){
    //     static_files.serve(req, res);
    //   });
    //   req.resume();
    // }
    // else {
    //   res.writeHead(403);
    //   res.end();
    // }
  }
  else {
    res.writeHead(403);
    res.end();
  }
}

var game; 
var dice = [
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
  },
  {
    elementId: '#dice6',
    value: 0,
    inPlay: true,
    justRolled: false
  }
];
var currentPlayer;

function connection(socket) {
  function disconnect() {
    console.log("disconnected");
  }

  function getStatus(userId) {
    // setUpMockGame();
    if(!game) {
      socket.emit("statusUpdate", "createGame");
      return;
    } 
    if(game.numberOfPlayers !== game.players.length) {
      socket.emit("statusUpdate", "registering");
      return;
    } else {
      io.sockets.emit("statusUpdate", "inprogress");
    }
    // if(!userId) {
    //   socket.emit("statusUpdate", "game");
    // }
  }

  function setUpMockGame() {
    if(!game) {
      game = {
        numberOfPlayers: 1,
        players: []
      };
    }
  }

  function restartGame() {
    game = undefined;
    resetDice();
    getStatus();
  }

  // function resetDice() {
  //   dice.forEach(function(die) {
  //     die.inPlay = true;
  //     die.win = undefined;
  //     die.score = undefined;
  //   });
  // }

  function createGame(numberOfPlayers) {
    game = {
      numberOfPlayers: numberOfPlayers,
      players: []
    };

    io.sockets.emit("statusUpdate", "registering");
  }

  function register(data) {
    var playerNumber = game.players.length + 1;
    data.playerNumber = playerNumber;
    data.totalTurnScore = 0;

    game.players.push(data);
    if (game.players.length === game.numberOfPlayers) {
      currentPlayer = game.players[0];
      io.sockets.emit("statusUpdate", "startGame", game);
    } else {
      socket.emit("statusUpdate", "registered");
    }
  }

  function roll() {
    // resetDice();
    diceRoller.resetJustRolled(dice);
    diceRoller.checkAllNotInPlay(dice);
    diceRoller.rollDiceInPlay(dice);
    scoreCalculator.calculateScoresForEachDice(dice);
    var turnScore = scoreCalculator.calculateTurnScore(dice);
    currentPlayer.totalTurnScore += turnScore;

    var diceData = {
      dice: dice,
      turnScore: turnScore,
      totalTurnScore: currentPlayer.totalTurnScore
    };

    io.sockets.emit("rolled", diceData);
  }

  function endGo() {
    currentPlayer.totalScore += currentPlayer.totalTurnScore;
    currentPlayer.totalTurnScore = 0;
    var prevPlayerNumber = currentPlayer.playerNumber;

    if (currentPlayer.playerNumber === game.players.length) {
      currentPlayer = game.players[0];
    } else {
      currentPlayer = game.players[currentPlayer.playerNumber];
    }
    
    resetDice();

    var data = { 
      name: currentPlayer.name,
      prevPlayerNumber: prevPlayerNumber
    };

    io.sockets.emit("nextPlayersTurn", data);
  }

  socket.on("disconnect", disconnect);
  socket.on("getStatus", getStatus);
  socket.on("createGame", createGame);
  socket.on("register", register);
  socket.on("roll", roll);
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
  port = 8006,
  host = "127.0.0.1",
  // ASQ = require("asynquence"),
  node_static = require("node-static"),
  static_files = new node_static.Server(__dirname),
  io = require("socket.io").listen(httpserv);

// require("asynquence-contrib");

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