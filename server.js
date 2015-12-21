function handleHTTP(req,res) {
  if (req.method == "GET") {
    if (req.url === '/game') {
      req.url = '/game.html';
      static_files.serve(req, res);
    } else
    if (/^\/\d+(?=$|[\/?#])/.test(req.url)) {
      req.addListener("end",function(){
        req.url = req.url.replace(/^\/(\d+).*$/,"/$1.html");
        console.log(req.url);
        static_files.serve(req,res);
      });
      req.resume();
    }
    else if (req.url === "/lib/jquery.js" || req.url === "/lib/handlebars-v4.0.5.js") {
      req.addListener("end",function(){
        static_files.serve(req, res);
      });
      req.resume();
    }
    else {
      res.writeHead(403);
      res.end();
    }
  }
  else {
    res.writeHead(403);
    res.end();
  }
}

var game; 
var dice = [
  {
    value: 0,
    inPlay: true
  },
  {
    value: 0,
    inPlay: true
  },
  {
    value: 0,
    inPlay: true
  },
  {
    value: 0,
    inPlay: true
  },
  {
    value: 0,
    inPlay: true
  },
  {
    value: 0,
    inPlay: true
  }
];

function connection(socket) {
  function disconnect() {
    console.log("disconnected");
  }

  function getStatus(userId) {
    console.log(game);
    if(!game) {
      socket.emit("statusUpdate", "createGame");
      return;
    } 
    if(game.numberOfPlayers !== game.players.length) {
      console.log(game.players.length);
      socket.emit("statusUpdate", "registering");
      return;
    } else {
      socket.emit("statusUpdate", "inprogress");
    }
    // if(!userId) {
    //   socket.emit("statusUpdate", "game");
    // }
  }

  function createGame(numberOfPlayers) {
    game = {
      numberOfPlayers: numberOfPlayers,
      players: []
    };

    socket.emit("statusUpdate", "registering");
  }

  function register(data) {
    game.players.push(data);
    if (game.players.length === game.numberOfPlayers) {
      io.sockets.emit("statusUpdate", "startGame", game);
    } else {
      socket.emit("statusUpdate", "registered");
    }
  }

  function roll() {
    rollDiceInPlay();
    calculateScore();

    socket.emit("rolled", dice);
  }

  function rollDiceInPlay() {
    dice.forEach(function(dice){
      if (dice.inPlay) {
        dice.value = Math.floor(Math.random() * 6) + 1;
      }
    });
  }

  function calculateScore() {
    var values = [0,0,0,0,0,0];

    dice.forEach(function(dice){
      if (dice.inPlay) {
        values[dice.value - 1] = values[dice.value - 1] + 1;
      }
    });

    console.log(values);

    singleDiceWin(values);

    if (sixOfAKind(values)) {
      return;
    }

    if (fiveOfAKind(values)) {
      return;
    }

    if (fourOfAKind(values)) {
      return;
    }

    if (threeOfAKind(values)) {
      threeOfAKind(values, true);
      return;
    }
  }

  function sixOfAKind(values) {
    var index;
    for (var i = 0; i < 6; i++) {
      if (values[i] === 6) {
        index = i;
      }
    }

    if (!index) {
      return false;
    }

    var diceValue = index + 1;
    dice.forEach(function(dice){
      if (dice.inPlay && dice.value === diceValue) {
        dice.score = get6ofAKindScore();
        dice.win = "6 of a kind";
      }
    });

    return true;
  }

  function get6ofAKindScore(diceValue) {
    switch (diceValue) {
      case 1: return 8000;
      case 2: return 1600;
      case 3: return 2400;
      case 4: return 3200;
      case 5: return 4000;
      case 6: return 4800;
    }
  }

  function fiveOfAKind(values) {
    var index;
    for (var i = 0; i < 6; i++) {
      if (values[i] === 5) {
        index = i;
      }
    }

    if (!index) {
      return false;
    }

    var diceValue = index + 1;
    dice.forEach(function(dice){
      if (dice.inPlay && dice.value === diceValue) {
        dice.score = get5ofAKindScore();
        dice.win = "5 of a kind";
      }
    });

    return true;
  }

  function get5ofAKindScore(diceValue) {
    switch (diceValue) {
      case 1: return 4000;
      case 2: return 800;
      case 3: return 1200;
      case 4: return 1600;
      case 5: return 2000;
      case 6: return 2400;
    }
  }

  function fourOfAKind(values) {
    var index;
    for (var i = 0; i < 6; i++) {
      if (values[i] === 4) {
        index = i;
      }
    }

    if (!index) {
      return false;
    }

    var diceValue = index + 1;
    dice.forEach(function(dice){
      if (dice.inPlay && dice.value === diceValue) {
        dice.score = get4ofAKindScore();
        dice.win = "4 of a kind";
      }
    });

    return true;
  }

  function get4ofAKindScore(diceValue) {
    switch (diceValue) {
      case 1: return 2000;
      case 2: return 400;
      case 3: return 600;
      case 4: return 800;
      case 5: return 1000;
      case 6: return 1200;
    }
  }

  function threeOfAKind(values, second) {
    var index,
      foundOnce = false,
      foundTwice = false;
    for (var i = 0; i < 6; i++) {
      if (values[i] === 3 && !second) {
        index = i;
        break;
      }
      if (values[i] === 3 && second) {
        if (foundOnce) {
          foundTwice = true;
          index = i;
          break;
        }
        foundOnce = true;
      }
    }

    if (!index) {
      return false;
    }

    var diceValue = index + 1;
    dice.forEach(function(dice){
      if (dice.inPlay && dice.value === diceValue) {
        dice.score = get3ofAKindScore();
        dice.win = foundTwice ? "3 of a kind (2)" : "3 of a kind";
      }
    });

    return true;
  }

  function get3ofAKindScore(diceValue) {
    switch (diceValue) {
      case 1: return 1000;
      case 2: return 200;
      case 3: return 300;
      case 4: return 400;
      case 5: return 500;
      case 6: return 600;
    }
  }

  socket.on("disconnect", disconnect);
  socket.on("getStatus", getStatus);
  socket.on("createGame", createGame);
  socket.on("register", register);
  socket.on("roll", roll);
}

function singleDiceWin(values) {
  if (values[0] === 1) {
    dice[0].score = 100;
    dice[0].win = "1";
  }
  if (values[4] === 1) {
    dice[4].score = 50;
    dice[4].win = "5";
  }
}

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