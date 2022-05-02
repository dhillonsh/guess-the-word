var wordBank = [];
var webSocket;
var followerQueue = [];

var minInitialLetters = 2;
var maxInitialLetters = 3;
var maxHints = 4;

var currentWord;
var currentHint;
var gameRunning = false;
var cycleInterval;

const winnerHeaderDOM = document.querySelector('.winnerHeader');
const starsContainer = document.querySelector('.starsContainer');

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomSubArray(array, count) {
  var res = [];
  while(res.length < count) {
    var r = Math.floor(Math.random() * array.length);
    if(res.indexOf(r) === -1) res.push(r);
  }
  
  return res;
}

function randomFromArray(array) {
  return array[Math.floor(Math.random() * 
 array.length)];
}

function resetState() {
  winnerHeaderDOM.style.display = "none";
  starsContainer.style.visibility = "hidden";
  
  document.querySelector('.winnerImageContainer').innerHTML = "";
  document.querySelector('.winnerNameContainer').innerHTML = "";

  currentWord = randomFromArray(wordBank);
  
  currentHint = [false, false, false, false, false];
  var hintCount = randomIntFromInterval(minInitialLetters, maxInitialLetters);
  
  var hintIndexes = randomSubArray(currentHint, hintCount);

  for (let i = 0; i < hintIndexes.length; i++) {
    currentHint[i] = true;
  }

  console.log("Reset game to word: " + currentWord + " with " + hintCount + " hints " + currentHint + ".");
  
  startGame();
}

function startGame() {
  cycleInterval = setInterval(updateCards, 100, true);

  setTimeout(acceptInput, 2500);
}

function acceptInput() {
  gameRunning = true;
  clearInterval(cycleInterval);
  
  updateCards(false);
  setInterval(function() {
    giveHint();
    updateCards(false);
  }, 4000);
}

function giveHint() {
  var missingLetters = [];
  for (let i = 0; i < currentHint.length; i++) {
    if (currentHint[i] === false) missingLetters.push(i);
  }
  
  // Make sure we don't give too many hints
  if (currentHint.length - missingLetters.length + 1 > maxHints) {
    console.log("Not giving any more hints");
    return;
  }
  
  var newHintIndex = randomFromArray(missingLetters);
  currentHint[newHintIndex] = true;
  console.log("Granting new hint at index " + newHintIndex);
}

function updateCards(cycle) {
  var cards = document.getElementsByClassName("card");
  var characters = 'abcdefghijklmnopqrstuvwxyz';
  
  for(let i = 0; i < cards.length; i++) {
      if(cycle === true) {
        cards[i].innerHTML = characters.charAt(Math.floor(Math.random() * characters.length));
      } else {
        cards[i].innerHTML = currentHint[i] === true ? currentWord[i] : "?";
      }
  }
}

function showFollower(text) {
  if (followerQueue.length === 0) return;
  const follower = followerQueue.shift();

  const followersContainer = document.querySelector('.followersContainer')
  const followerDiv = document.createElement('div')
  followerDiv.style.display='none';
  followerDiv.classList.add("follower")
  
  /* Add profile image */
  const followerImage = document.createElement('img');
  followerImage.classList.add("followerImage")
  followerImage.src = follower.picture;
  followerDiv.appendChild(followerImage);
  
  /* Add Following text */
  var followingText = document.createElement('p');
  followingText.appendChild(document.createTextNode("Followed"));
  followerDiv.appendChild(followingText);

  /* Handled through CSS, the element moves behind .bottom
  window.setTimeout(
    function removethis()
    {
      followerDiv.style.display='none';
    }, 2900);
  */

  followersContainer.appendChild(followerDiv);
  followerDiv.style.display='inline';
}

function handleGuess(resp) {
  if (resp.comment.toLowerCase() !== currentWord) {
    return
  }
  const winnerImageContainer = document.querySelector('.winnerImageContainer');
  const winnerImage = document.createElement('img');
  winnerImage.classList.add("winnerImage");
  winnerImage.src = resp.picture;
  winnerImageContainer.innerHTML = winnerImage.innerHTML;
  winnerImageContainer.appendChild(winnerImage);
  
  const winnerNameContainer = document.querySelector('.winnerNameContainer');
  const winnerName = document.createElement('div');
  winnerName.classList.add("winnerName");
  winnerName.innerHTML = resp.uniqueId;
  winnerNameContainer.appendChild(winnerName);

  winnerHeaderDOM.style.display = "block";

  // Show all cards
  for (let i = 0; i < currentHint.length; i++) {
    currentHint[i] = true;
  };
  updateCards(false);

  spawnStars();
  gameRunning = false;
  setTimeout(resetState, 3000);
}

function webSocketHandler(data) {
  console.log(data);
  var resp = JSON.parse(data.data);

  if (resp.event == "follow") {
    followerQueue.push(resp);
  } else if(resp.event == "chat") {
    if (gameRunning !== true) {
      return
    }

    handleGuess(resp);
  }
}

function configureWebHook() {
  webSocket = new WebSocket("ws://" + location.host + "/");
  webSocket.onopen = function(e) {
    console.log("[open] Connection established");
  };
  webSocket.onmessage = webSocketHandler;

  resetState();
}

function retrieveWordBank() {
  $.ajax({
    url: "/wordbank",  
    success:function(data) {
      console.log("Retrieved word bank.");

      wordBank = data;
      configureWebHook();
    }
  });
}

//retrieveWordBank();

setInterval(function() {
  showFollower();
}, 2000);

/*
setInterval(function() {
  followerQueue.push({"picture": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQUAAADBCAMAAADxRlW1AAAAeFBMVEX//e7r6+vq6urs7Ozp6ekAAADT09P///Xt7uqKi4a+v73r6Nzl5trh4eEREA/y8vFfX2G5ubipqavW1tbPz89vb3Hq692MjI6ur7GioqTExMN1dXeEhIa1tbfk5NmCgoVUVFR/f31oaGqRkZOenqBvb2zW1s5fYFykrvEKAAADrUlEQVR4nO3c21raQBRAYcIk1qqUqnhoxUNra9//DcsmQDKZCUwIZG/51roRk5BMfoZIQTvKm40XBQsb68tNqlsp9ys32bZxwh6CHUX34A8s4X6jzmNBYb3+JBX8O/kb1paXN5eb1rap3wyO0oDKWw7iLx3XC3fknel6i+bq+q3NhuFuawqtdP6JBUeJbr1NIS0PIVTwH+/w0Q8m3DiWf0gUpMgzIhiSf4raCsEz4hAKUeS2o+za75bVCXvwR7d7J3nwJWHL6DiOoZBwAtvWoaCssF6x49i78w8WHVzCk2bgRrs36RYKEgoSCkN3ME4UJBSkT61wsFCQUJBQkFCQUJBQkHopZM6de7nmgqFaHDhTUsgmP8MulJo5JQV3U9jpbaql8FjMv9roV/FdS+H8sbj/YqN7XYWRja5QGKFQhoKEgoSCpKlwgwIKKKDgN0UBhVU8I1BAAQUUUEABBRRQQAEFFFBAgfcXUEABBRRQQAEFFFAYQmHxCvpS+/RXoSChIOn+Rg8K4ym/14TC6SlkZcGKtuW19TZ/0y/bVFvQ9gUFFFDYolDdMQvyF1bfGbs6hgPfcULVuj4KpubCbxQOrNCpz6CQRnMyCk9aCoauji96Cqbmwp2igp1/WXeZC0EnotDtGXGqCt2eEQdVMHR1REFSvC6gYE7hVfHqaEdhrqbwjAIKKKBgWOFB7SelJQW1uWBKgbmAQhkKkqaCpVfQagqmflK+o8BcWKb7esHO+456c8HS1ZHXjiiUKb7jhsJSwdJ1gfegVT+h4xmxVLAzF3Q/j7Dyqkn3M2s7cwEF1c+sTSnwWxzacwEFFJYZer3wgsIIhTIUJBQkro6SpoKl/3kABV2FHyiggIJJBc3XC3YUmAsSClK3v6c8rMIfFFAwqNDyN/cooIDCwArvKCwUHlBAAQUUUEChVeFK+/RXaSrMmQsorBReUVgoPKGAAgooNBTuUEABBRRQQGGZc666JTenf4uPSxt9FP/O44MeQuGblYq3+FwYQOGusFM/BbdpfX5BUQVpcvF8/RxWW3ZdFdmwvrpvt+GAw0cwWL36ro9C5iazVWe9u+3V2SQy4DYF5y13fRXG+ayqP8S+evIlz8IB76XgOitk+dlse4NZZJEB76fQuTybGCl345QBtz3OvRQ2lvF9NwcQPj7hAJP2Fd1/0kZHUMjSDj1EWdpYjjIXunTsudCrwRRMh4KEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgvQfH2tkLn6MlyUAAAAASUVORK5CYII="});
}, 100);
*/

function spawnStars() {
  starsContainer.innerHTML = "";
  starsContainer.style.visibility = "visible";

  const colors = [
    "red",
    "yellow",
    "green",
    "orange",
    "purple"
  ];

  for (let i = 0; i < 40; i++) {
    var star = document.createElement('span');
    star.id = "star_" + i;
    star.classList.add("star");
    star.classList.add("fa");
    star.classList.add("fa-star");

    star.style.color = randomFromArray(colors);
    star.style.bottom = randomIntFromInterval(-3, 4) + "vh";
    star.style.left = randomIntFromInterval(-1, 10) + "vw";
    starsContainer.appendChild(star);

    /* Display until a random time */
    star.style.display = "none";
    setTimeout(function() {
      star = document.querySelector("#star_" + i);
      star.style.display = "block";
    }, randomIntFromInterval(0, 4000));
  }
}
