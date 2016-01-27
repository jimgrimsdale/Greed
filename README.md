# Greed

To run locally:  

1) `npm install`  
2) `node server.js`  
3) go to localhost:8006/game  

Greed is a dice game also known as Farkle and more information can be found here: https://en.wikipedia.org/wiki/Farkle. A summary of the rules is as follows:  

The game is played by two or more players, with each player in succession having a turn at throwing the dice. Each player's turn results in a score, and the scores for each player accumulate to some winning total.  

- At the beginning of each turn, the player throws all of the dice
- After each throw, one or more scoring dice must be set aside.
- The player may then either end their turn and bank the score.accumulated so far, or continue to throw the remaining dice.
- If the player has scored all six dice, they may continue their turn with a new throw of all six dice, adding to the score they have already accumulated
- If none of the dice score in any given throw, the player's turn is ended and all points for that turn are lost.
- Once a player has achieved the winning score total, each other player has one last turn to score enough points to surpass that high-score.

Once you are in the game you can view the various roll scores by clicking Toggle Score/Scoring Table at the bottom.

Three instances of the game have been set up at the urls below. Only one game can be played at a time on each instance.

http://nodejs-greedgame.rhcloud.com/game  
http://nodejs1-greedgame.rhcloud.com/game  
http://nodejs2-greedgame.rhcloud.com/game  
