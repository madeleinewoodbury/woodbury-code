// -----------------
// GLOBAL VARIABLES
// -----------------

const gridContainer = document.querySelector('.grid-container');
const stars = document.querySelectorAll('li');
const icons = ["airplane", "car", "doughnut", "earth-globe", "gamepad", "llama", "rocket", "squirrel"];

// double the array
const iconsArray = icons.concat(icons);

let count = 0;
let firstCard = '';
let secondCard = '';
let moves = 0;
let matchesFound = 0;
let rating = 3;
let movesDisplay = document.getElementById('moves-display');
let timerDisplay = document.querySelector('#timerDisplay');
let seconds = 0;
let interval = setInterval(timer, 1000);

// set the initial moves to 0
movesDisplay.textContent = moves;

// randomly sort iconsArray
iconsArray.sort(function(){
    return 0.5 - Math.random();
});

// draw the grid of cards
for(let i = 0; i < iconsArray.length; i++){
    const card = document.createElement('card');
    card.classList.add('card');
    card.dataset.name = iconsArray[i];

    const front = document.createElement('div');
    front.classList.add('front');
    front.style.backgroundImage = `url("media/memory.svg")`

    const back = document.createElement('div');
    back.classList.add('back');
    let img = iconsArray[i];
    back.style.backgroundImage = `url("media/${img}.svg")`

    card.appendChild(front);
    card.appendChild(back);

    gridContainer.appendChild(card);
}

// EVENT LISTENER
gridContainer.addEventListener('click', function(e){
    // store the card clicked
    let clicked = e.target;

    // determine if card clicked is a valid option
    if(clicked.classList.contains('grid-container') ||
        clicked.parentNode.classList.contains('selected') ||
        clicked.classList.contains('match')){
        return;
    }

    // only 2 cards can be selected at a time
    if(count < 2){
        count++;

        // access the clicked card's parant and toggle flip and selecte class
        let selectedCard = clicked.parentNode;
        selectedCard.classList.toggle('flip');
        selectedCard.classList.toggle('selected');

        // set the firstCard or secondCard variables
        if(count === 1){
            firstCard = selectedCard.dataset.name;
        }else{
            secondCard = selectedCard.dataset.name;

            // update moves
            movesDisplay.textContent = moves += 1;
            // check star rating nad update stars displayed
            updateStars();  
        }

        if(firstCard && secondCard){
            if(firstCard === secondCard){
                match();
            }

            // reset guesses
            setTimeout(resetGuesses, 1000);
        }
    }
 
// ----------
// FUNCTIONS
// ----------

// RESET GUESSES AND COUNT
function resetGuesses(){
    firstCard = '';
    secondCard = '';
    count = 0;

    // remove the flip class from selected cards
    let selectedCards = document.querySelectorAll('.selected');
    for(let card of selectedCards){
        card.classList.toggle('flip');
        card.classList.remove('selected');
    }
}

// MATCH
function match(){
    // replace the selected class with match
    let selectedCards = document.querySelectorAll('.selected');
    for(let card of selectedCards){
        card.classList.remove('selected');
        card.children[1].classList.add('match');
    }

    matchesFound++;

    // check if all matches have been found
    if(matchesFound === 8){
        modal();
    }
}

})

// MODAL
function modal(){
    const modal = document.querySelector('.modal');
    const restartBtn = document.querySelector('#restart-btn');
    const totalTime = document.querySelector('#totalTime');
    const totalMoves = document.querySelector('#totalMoves');
    const totalStars = document.querySelector('#totalStars');

    // clear interval and display total time
    clearInterval(interval); 
    totalTime.innerHTML = seconds;
    totalMoves.innerHTML = moves;
    totalStars.innerHTML = rating;

    // display modal
    modal.style.display = 'block';

    restartBtn.addEventListener('click', function(){
        console.log('restart button clicked')
        modal.style.display = 'none';

        // reload the window to retart the game
        window.location.reload(true);
    });
}

// PLAY AGAIN BUTTON
const playAgainBtn = document.querySelector('#playAgainBtn');

playAgainBtn.addEventListener('click', function(){
    window.location.reload(true);
});

// TIMER
function timer(){
    seconds++;
    timerDisplay.innerHTML = seconds;
}

// REMOVE STARS 
function updateStars(){
    if(moves > 15 && rating === 3){
        stars[2].classList.add('hide');
        rating = 2;
    }else if(moves > 20 && rating === 2){
        stars[1].classList.add('hide');
        rating = 1;
    }
}


