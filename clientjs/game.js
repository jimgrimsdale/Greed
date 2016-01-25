var name;
var playerNumber = 1;
var rollScore;

function createGuid() {
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

var socket = io.connect("/",{
  "connect timeout": 3000,
  "reconnect": false
});

socket.emit("getStatus");

socket.on("statusUpdate", function(status, game, minutesSinceGameCreated) {
  var template;

  if (status === 'startGame' && !name) {
    status = "inprogress";
  }

  switch (status) {
    case "createGame":
      var source   = $("#create-game-template").html();
      template = Handlebars.compile(source);
      break;
    case "registering": 
      var source = $("#registering-template").html();
      template = Handlebars.compile(source);
      break;
    case "registered": 
      var source   = $("#message-template").html();
      template = Handlebars.compile(source);
      var context =  { message: "Waiting for players..."};
      template = template(context);
      break;
    case "inprogress": 
      var source   = $("#message-template").html(),
        context;
      template = Handlebars.compile(source);

      context = { message: "Game in progress. The game was created " + 
        minutesSinceGameCreated + " minutes ago. Click <span class='restartGame'>here</span> to end it and start a new one."};

      template = template(context);
      break;
    case "startGame":
      var source = $("#game-template").html();
      template = Handlebars.compile(source);

      var thead = '<th>Round</th>',
        trRound1 = '<td>1</td>',
        trTotal = '<td>Total</td>';

      game.players.forEach(function(player) {
        thead += '<th>' + player.name + '</th>';
        trRound1 += '<td></td>';
        trTotal += '<td>0</td>';
      });

      var context = {
        playerName: getPlayerNameText(game.players[0].name),
        total: 0,
        runningTotal: 0,
        thead: thead,
        trRound1: trRound1,
        trTotal: trTotal,
        disabled: game.players[0].name === name ? '' : 'disabled'
      }
      template = template(context);
      break;
  }
  $('.template-container').html(template);
  setClickHandlers();
});

function getPlayerNameText(currentPlayerName) {
  if (currentPlayerName === name) {
    return 'Your turn';
  }
  return currentPlayerName + "'s turn";
}

socket.on("rolled", rolled);

function rolled(diceData) {
  setPlayedDiceOpacity();
  removeDiceClickHandlers();

  $.when(animate.rollJustRolledDice(diceData.dice)).then(
    function() {
      showWin(diceData);
      rollScore = diceData.turnScore;
      $('.totalTurnScore').text(diceData.totalTurnScore);
      $('.totalScore').text(diceData.totalScore);
      if (diceData.turnScore === 0) {
        loseGo(diceData.currentPlayerName);
      }
      if (diceData.currentPlayerName === name && diceData.turnScore !== 0) {
        enableButtons();
      }       
    });
}

function loseGo(currentPlayerName) {
  if (currentPlayerName === name) {
    socket.emit('endGo');
  }
}

function rollAgainValid(dice) {
  var count = 0,
    noDieDeselected = true;
  dice.forEach(function(die) {
    if (die.deselected) {
      noDieDeselected = false;
    }
    // if die has been selected
    if (die.deselected === false && (die.value !== 1 && die.value !== 5)) {
      count++;
    }
  });
  if (noDieDeselected || count === 0 || count === 3) {
    return true;
  }
  return false;
}

function showWin(diceData) {
  var strWin = "";
  var strScore = "";
  var isCurrentPlayer = diceData.currentPlayerName === name;
  diceData.dice.forEach(function(die, i) {
    if (die.win && die.justRolled && (strWin.indexOf(die.win) === -1 || die.win === "1" || die.win === "5")) {
      strWin += die.win + ", ";
      strScore += " " + die.score;      
    }

    if (die.deselected && isCurrentPlayer) {
      $('#dice' + i).data('diceNumber', i);
      $('#dice' + i).data('deselected', false);
      $('#dice' + i).on('click', updateScores);
      $('#dice' + i).addClass('selectable');
    }

    if (die.justRolled && (die.win || die.deselected === false)) {
      $('#dice' + i).css('-webkit-filter', 'sepia(1)');        
      if (isCurrentPlayer && moreThanOneWin(diceData.dice)) {
        $('#dice' + i).data('diceNumber', i);
        $('#dice' + i).data('deselected', true);
        $('#dice' + i).on('click', updateScores);
        $('#dice' + i).addClass('selectable');
      }        
    } else {
      $('#dice' + i).css('-webkit-filter', '');
    }
  });
  if (strWin !== "") {
    strWin = strWin.slice(0, -2);
    if (strWin === "3ofakind") {
      strWin = "3 of a kind";
    }
    if (strWin !== "3ofakind" && strWin.indexOf("3ofakind") !== -1) {
      strWin = "3 of a kind, 3 of a kind";
    } 
  }

  if (strWin) {
    $('.message').text(strWin);
  }  
}

function moreThanOneWin(dice) {
  var win, die;
  for (var i = 0; i < 6; i++) {
    die = dice[i];
    if (die.justRolled && die.win && 
      ((die.win.indexOf("4 of a kind") !== -1) ||
      (die.win.indexOf("5 of a kind") !== -1) ||
      (die.win.indexOf("6 of a kind") !== -1))) {
      return true;
    }
    // 3 ones or fives
    if (die.justRolled && die.win && die.win.indexOf("kind") !== -1 && (die.value === 1 || die.value === 5)) {
      return true;
    }
    if (!win && die.justRolled && die.win) {
      win = die.win;
    } else {
      if (die.justRolled && die.win && (die.win === "1" || die.win === "5" || win !== die.win)) {
        return true;
      }
    }
  }
  return false;
}

function updateScores() {
  var $dieEl = $(this);
  var deselected = $dieEl.data('deselected');
  turnScore = rollScore;
  socket.emit('updateScores', $dieEl.data('diceNumber'), turnScore, deselected);
}

socket.on('updatedScores', updatedScores);

function updatedScores(diceData) {
  removeDiceClickHandlers();
  showWin(diceData);
  rollScore = diceData.turnScore;
  $('.totalTurnScore').text(diceData.totalTurnScore);
  $('.totalScore').text(diceData.totalScore);

  if (diceData.currentPlayerName === name) {
    if (rollAgainValid(diceData.dice)) {
      $('.roll').removeClass('disabled');
    } else {
      $('.roll').addClass('disabled');
    }
  }
}

function setPlayedDiceOpacity() {
  var count = 0;
  for(var i = 0; i < 6; i++) {
    var $dice = $('#dice' + i);
    if ($dice.css('opacity') === "0.5") {
      count++;
    }
    if ($dice.css('-webkit-filter') === "sepia(1)") {
      $dice.css('-webkit-filter', '');
      $dice.css('opacity', 0.5);
      count++;
    }
  }
  if (count === 6) {
    for(var i = 0; i < 6; i++) {
      var $dice = $('#dice' + i);
      $dice.css('opacity', '');
    }
  }
}

function removeDiceClickHandlers() {
  for(var i = 0; i < 6; i++) {
    $('#dice' + i).off('click');
    $('#dice' + i).removeClass('selectable');
  }
}

function resetDiceCss() {
  for(var i = 0; i < 6; i++) {
    var $dice = $('#dice' + i);
    $dice.css('-webkit-filter', '');
    $dice.css('opacity', '');
  }
}

socket.on("nextPlayersTurn", nextPlayersTurn);

function nextPlayersTurn(data) {
  var winner, prevPlayerName;
  removeDiceClickHandlers();
  updateScoreTable(data);

  if (data.winner) {
    $('.player-name').text('');
    winner = data.winner === name ? "You" : data.winner;
    $('.message').text(winner + " won!");
    disableButtons();
  } else {
    if (data.prevPlayerTotalTurnScore === 0) {
      if (data.prevPlayerName === name) {
        $('.message').text('Unlucky!');
      } else {
        $('.message').text(data.prevPlayerName + ' scored nothing!');
      }
    } else {
      prevPlayerName = data.prevPlayerName === name ? "You" : data.prevPlayerName;
      $('.message').text(prevPlayerName + ' scored ' + data.prevPlayerTotalTurnScore);
    }
    setTimeout(function() {
      var playerNameText = getPlayerNameText(data.name);
      $('.player-name').text(playerNameText);

      if (name === data.name) {
        $('.roll').removeClass("disabled");
        $('.endGo').addClass("disabled");
      }

      $('.totalTurnScore').text(0);
      $('.totalScore').text(data.totalScore);
      $('.message').text('');

      resetDiceCss();
    }, 2000);
  }
}

function updateScoreTable(data) {
  var $scoreRow = $('.score-table tr:last').prev();
  var $totalScoreRow = $('.score-table tr:last');
  var columnNumber = data.prevPlayerNumber + 1;
  var $scoreCell = $scoreRow.find('td:nth-child(' + columnNumber  + ')');
  var $totalScoreCell = $totalScoreRow.find('td:nth-child(' + columnNumber  + ')');
  $scoreCell.text(data.prevPlayerTotalTurnScore);
  $totalScoreCell.text(data.prevPlayerTotalScore);

  if (data.endOfRound) {
    var newRow = '<tr><td>' + data.round + '</td>';
    for(var i = 0; i < data.numberOfPlayers; i++) {
      newRow += '<td></td>';
    }
    newRow += '</tr>';
    var $newRow = $(newRow);
    $scoreRow.after($newRow);
  }    
}

function enableButtons() {
  $('.btn').each(function() {
    $(this).removeClass("disabled");
  });
}

function disableButtons() {
  $('.btn').each(function() {
    $(this).addClass("disabled");
  });
}

function setClickHandlers() {
  $('.number-of-players-button').on('click', function() {
    var winningScore = parseInt($('#winning-score').val(), 10),
      numberOfPlayers = parseInt($(this).text(), 10);
    socket.emit("createGame", winningScore, numberOfPlayers);
  });

  $('#name').keypress(function(e){
    if(e.keyCode===13)
    $('.join').click();
  });

  $('.join').on('click', function() {
    name = $('#name').val();
    var data = {
      name: $('#name').val(),
      id: createGuid()
    }
    socket.emit("register", data);
  });

  $('.roll').on('click', function() {
    disableButtons();
    socket.emit("roll");
  });

  $('.restartGame').on('click', function() {
    socket.emit('restartGame');
    location.reload();
  });

  $('.endGo').on('click', function() {
    disableButtons();
    socket.emit("endGo");
  });

  $('.toggle-tables').on('click', function() {
    $('.score-table').toggle();
    $('.scoring-table').toggle();
  });
}