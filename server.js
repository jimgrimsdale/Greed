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
    setUpMockGame();
    if(!game) {
      socket.emit("statusUpdate", "createGame");
      return;
    } 
    if(game.numberOfPlayers !== game.players.length) {
      socket.emit("statusUpdate", "registering");
      return;
    } else {
      socket.emit("statusUpdate", "inprogress");
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
    resetDice(); //to remove

    diceRoller.rollDiceInPlay(dice);
    diceRoller.calculateScore(dice);

    socket.emit("rolled", dice);
  }

  socket.on("disconnect", disconnect);
  socket.on("getStatus", getStatus);
  socket.on("createGame", createGame);
  socket.on("register", register);
  socket.on("roll", roll);
}

function resetDice() {
  dice.forEach(function(die) {
    die.win = undefined;
    die.score = undefined;
  });
}

var diceRoller = require('./diceRoller.js');
console.log(diceRoller);

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