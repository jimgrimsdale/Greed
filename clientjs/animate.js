var animate = (function() {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var diceScoreMap = {
    1: "class13",
    2: "class14",
    3: "class15",
    4: "class16",
    5: "class17",
    6: "class18",
  };

  diceElementIdMap = {
    0: '#dice1',
    1: '#dice2',
    2: '#dice3',
    3: '#dice4',
    4: '#dice5',
    5: '#dice6',
  };

  function rollDice($dice, score) {
    var turns = getRandomInt(5, 15);
    var turnCount = 0;
    turnDice();

    function turnDice() {
      setTimeout(function() {
        var className = "class" + getRandomInt(1, 18);
        $dice.removeClass();
        $dice.addClass(className);
        $dice.addClass("dice");
        turnCount++;
        if (turnCount === turns) {
          className = diceScoreMap[score];
          $dice.removeClass();
          $dice.addClass(className);
          $dice.addClass("dice");
        } else {
          turnDice();
        }
      }, 100);
    }
  }

  function rollAllDice(diceScores) {
    diceScores.forEach(function(score, i) {
      if (score !== 0) {
        var $dice = $(diceElementIdMap[i]);
        rollDice($dice, score);
      }
    });
  }

  return {
    rollDice: rollDice,
    rollAllDice: rollAllDice
  };
}());