var animate = (function() {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var diceValueMap = {
    1: "class13",
    2: "class14",
    3: "class15",
    4: "class16",
    5: "class17",
    6: "class18",
  };

  diceElementIdMap = {
    0: '#dice0',
    1: '#dice1',
    2: '#dice2',
    3: '#dice3',
    4: '#dice4',
    5: '#dice5',
  };

  function rollDice($dice, value) {
    var dfd = $.Deferred();

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
          className = diceValueMap[value];
          $dice.removeClass();
          $dice.addClass(className);
          $dice.addClass("dice");
          dfd.resolve();
        } else {
          turnDice();
        }
      }, 100);
    }

    return dfd.promise();
  }

  function rollAllDice(diceScores) {
    diceScores.forEach(function(score, i) {
      if (score !== 0) {
        var $dice = $(diceElementIdMap[i]);
        rollDice($dice, score);
      }
    });
  }

  function rollJustRolledDice(dice) {
    var dfd = jQuery.Deferred();
    var numberJustRolled = 0;
    var count = 0;

    dice.forEach(function(die) {
      if (die.justRolled) {
        numberJustRolled++;
        var $dice = $(die.elementId);
        var value = die.value;

        $.when(rollDice($dice, value)).then(
          function() {
            count++;
            if (count === numberJustRolled) {
              dfd.resolve();
            }
          }
        );
      }
    });

    return dfd.promise();
  }

  return {
    rollDice: rollDice,
    rollAllDice: rollAllDice,
    rollJustRolledDice: rollJustRolledDice
  };
}());