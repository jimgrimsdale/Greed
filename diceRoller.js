function rollDiceInPlay(dice) {
  dice.forEach(function(dice){
    if (dice.inPlay) {
      dice.value = Math.floor(Math.random() * 6) + 1;
    }
  });
  // var count = 0;
  // dice.forEach(function(dice){
  //   count++;
  //   if (count <= 3) {
  //     dice.value = 1;
  //   }
  //   if (count === 4) {
  //     dice.value = 5;
  //   } 
  //   if (count > 4) {
  //     dice.value = 6;
  //   }
  // });
}

function calculateScore(dice) {
  var values = [0,0,0,0,0,0];

  dice.forEach(function(dice){
    if (dice.inPlay) {
      values[dice.value - 1] = values[dice.value - 1] + 1;
    }
  });

  console.log(values);

  singleDiceWin(dice);

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

  if (threePair(values)) {
    return;
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
        dice.score = get6ofAKindScore(diceValue);
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
        dice.score = get5ofAKindScore(diceValue);
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
        dice.score = get4ofAKindScore(diceValue);
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

    if (index === undefined) {
      return false;
    }

    var diceValue = index + 1;

    dice.forEach(function(dice){
      if (dice.inPlay && dice.value === diceValue) {
        dice.score = get3ofAKindScore(diceValue);
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

  function threePair(values) {
    var numberOfPairs = 0;

    values.forEach(function(value) {
      if (value = 2) {
        numberOfPairs++;
      }
    });

    if (numberOfPairs !== 3) {
      return false;
    }

    dice.forEach(function(die) {
      die.score = 750;
      die.win = "3 pairs";
    });

    return true;
  }

  function singleDiceWin(dice) {
    dice.forEach(function(die) {
      if (die.value === 1) {
        die.score = 100;
        die.win = "1";
      }
      if (die.value === 5) {
        die.score = 50;
        die.win = "5";
      }
    });
  }
}

module.exports.rollDiceInPlay = rollDiceInPlay;
module.exports.calculateScore = calculateScore;