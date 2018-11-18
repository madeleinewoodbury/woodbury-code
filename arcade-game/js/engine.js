/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on the player and enemy objects (defined in app.js).
 *
 * A game engine works by drawing the entire game screen over and over.
 * When your player moves across the screen, it may look like just that 
 * image/character is moving or being drawn but that is not the case. 
 * What's really happening is the entire "scene" is being drawn over and over, 
 * presenting the illusion of animation.
 *
 * This engine makes the canvas' context (ctx) object globally available to make 
 * writing app.js a little simpler to work with.
 */

const Engine = (function(global) {
    /* Predefine the variables within this scope,
     * create the canvas element, grab the 2D context for that canvas
     */
    const doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        modal = doc.getElementById('myModal'), 
        closeBtn = doc.querySelector('.close'), // the span el that closes the modal
        timeInterval = setInterval(timer, 1000);

    let gemOnBoard = false, // when set to true a new gem will be rendered
        currentGem, // current gem object on the board
        seconds = 30,
        minutes = 1,
        timeIsPaused = false,
        isModalVisible = false,
        lastTime,
        minutesDisplay = doc.getElementById('minutes'),
        secondsDisplay = doc.getElementById('seconds');

    // set the canvas elements height/width and add it to the DOM.
    // the window innerWidth and innerHeight will determine the canvas size
    if(win.innerWidth > 730){
        canvas.width = 707;
    }else{
        canvas.width = 404;
    }

    if(win.innerHeight > 760){
        canvas.height = 650; 
    }else if(win.innerHeight > 600){
        canvas.height = 550; 
    }else{
        canvas.height = 460;
    }

    doc.body.appendChild(canvas);

    // set the timer to display minutes and seconds (1:30)
    minutesDisplay.innerHTML = minutes;
    secondsDisplay.innerHTML = seconds;

    // Event listeners on the modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
        isModalVisible = false;
        if(player.isGameOver || player.hasWon){
            reset();
        }else{
            player.needsInfo = false;
            // Resume timer
            timeIsPaused = false;
        }
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            isModalVisible = false;
            if(player.isGameOver || player.hasWon){
                reset();
            }else{
                player.needsInfo = false;
                // Resume timer
                timeIsPaused = false;
            }
        }
    }

    // This method draw the game stats beneath the canvas
    drawGameStats();

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required for smooth animation. 
         * Because everyone's computer processes instructions at different speeds 
         * we need a constant value that would be the same for everyone.
         */
        let now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call the update/render functions, pass along the time delta to
         * the update function since it may be used for smooth animation.
         */
        update(dt);
        render();

        /* Set the lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;
    
        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        lastTime = Date.now();
        main();
    }

    /* This function is called by main (the game loop) and itself calls all
     * of the functions which may need to update entity's data. 
     */
    function update(dt) {
        if(!player.isGameOver){
            // If the player is not game over, check to see if modal is visible
            if(isModalVisible){
                // If the modal is visible, check if player hasWon or needsInfo
                if(!player.needsInfo && !player.hasWon){
                    // hide modal
                    modal.style.display = "none";
                    isModalVisible = false;
                    // Resume timer
                    timeIsPaused = false;                    
                }
            }else if(player.hasWon){
                // show modal if the player has won the game
                showModal();
            }else if(player.needsInfo){
                // show game instructions (this method will pause the game)
                showInfoModal();
            }
            else{
                // update the enities data
                updateEntities(dt);
                checkCollisions();
            }
        }else{
            // The player is game over, show modal
            showModal();
        }
    }

    /* This is called by the update function and loops through all of the
     * objects within the allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for the
     * player object. These update methods should focus purely on updating
     * the data/properties related to the object. 
     */
    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });

        player.update();

        // check if player grabs a gem
        if(gemOnBoard){
            if(currentGem.grabGem()){
                updatePoints();
            }
        }

    }

    function checkCollisions(){
        allEnemies.forEach(function(enemy) {
            if(enemy.collision()){
                // when collision occurs, update lives and hearts displayed
                player.updateLives(-1);
                updateHearts(-1);
            };
        });
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. This function is called every
     * game tick (or loop of the game engine).
     */
    function render() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        let rowImages = [
                'images/water-block.png',   // Top row is water
                'images/stone-block.png',   // Row 1 of 3 of stone
                'images/stone-block.png',   // Row 2 of 3 of stone
                'images/stone-block.png',   // Row 3 of 4 of stone
                'images/stone-block.png',   // Row 4 of 4 of grass
                'images/grass-block.png',    // Row 1 of 2 of grass
                'images/grass-block.png'    // Row 2 of 2 of grass
            ],
            numRows =7,
            numCols = 7,
            row, col,
            selectorY = 480,
            infoX = 620,
            infoY = 550;
        
            // Change the variables based on the  canvas with and height
            if(canvas.width !== 707){
                numCols = 4;
                infoX = 318;
            }

            if(canvas.height !== 650){
                if(canvas.height === 550){
                    numRows = 6;
                    // remove a stone block from rowImages array
                    rowImages.splice(1,1);
                    selectorY = 378;
                    infoY = 455;
                }else{
                    numRows = 5;
                    // remove a stone block from rowImages array
                    rowImages.splice(1,1);
                    // remove a grass block from rowImages array
                    rowImages.pop();
                    selectorY = 290;
                    infoY = 368;
                }
            }
        
        // Before drawing, clear existing canvas
        ctx.clearRect(0,0,canvas.width,canvas.height)

        /* Loop through the number of rows and columns defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }

        // Render Selector and question-mark tile
        ctx.drawImage(Resources.get('images/question-mark.png'), infoX, infoY);
        ctx.drawImage(Resources.get('images/Selector.png'), 0, selectorY);


        renderEntities();
    }

    /* This function is called by the render function and is called on each game
     * tick. Its purpose is to then call the render functions defined
     * on the enemy and player entities within app.js
     */
    function renderEntities() {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function
         */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });

        player.render();
        
        // Render a new random gem if there is no current gem on the  boards
        if(!gemOnBoard){
            currentGem= getRandomGem();
            gemOnBoard = true;
        }

        // Render current gem and goal(star)
        currentGem.render();
        goal.render();
    }

    // This function genereates a new random gem object
    function getRandomGem(){
        let gemToRender = gems[Math.floor(Math.random() * 50)];

        // Prevent hearts on the board while the player has three lives
        if(player.lives === 3 && gemToRender.value === 0){
            while(gemToRender.value === 0){
                gemToRender = gems[Math.floor(Math.random() * 50)];
            }
        }
        return gemToRender;
    }

    // This function resets the game by reloading the window element
    function reset() {
        win.location.reload();
    }

    // Dynamically draws game stats content
    function drawGameStats(){
        
        // Create gameStats elements
        const gameStatsDiv = doc.createElement('div'),
            livesUl = doc.createElement('ul'),
            pointsDiv = doc.createElement('div'),
            restartDiv = doc.createElement('div');

        // Set gameStats content and classes
        livesUl.classList.add('lives');
        livesUl.innerHTML = `
            <li><i class="fas fa-heart"></i></li>
            <li><i class="fas fa-heart"></i></li>
            <li><i class="fas fa-heart"></i></li>
        `;
        pointsDiv.classList.add('points');
        pointsDiv.innerHTML = 'Points: 0';
        restartDiv.classList.add('restart');
        restartDiv.innerHTML = `
            <span id="playAgainBtn"><i class="fas fa-redo"></i></span>
        `;

        // Append to gameStatsDiv
        gameStatsDiv.classList.add('game-stats');
        gameStatsDiv.appendChild(livesUl);
        gameStatsDiv.appendChild(pointsDiv);
        gameStatsDiv.appendChild(restartDiv);

        doc.body.appendChild(gameStatsDiv);

    }

    // This function updates the timer every second
    function timer(){
        if(!timeIsPaused){
            seconds--;

            if(seconds === -1 && minutes !== 0){
                minutes--;
                seconds = 59;
            }

            minutesDisplay.innerHTML = minutes;
            // doc.getElementById('minutes').innerHTML = minutes;
            if(seconds < 10){
                // document.getElementById('seconds').innerHTML = '0' +seconds;
                secondsDisplay.innerHTML = '0' + seconds;
            }else{
                // document.getElementById('seconds').innerHTML = seconds;
                secondsDisplay.innerHTML = seconds;
            }

            // If minutes and seconds both reach 0, the time is up
            if(minutes === 0 && seconds === 0){
                clearInterval(timeInterval);
                // player is GAME OVER
                player.isGameOver = true;
            }
        }
    }

    // This function updates the player's points and displayes them in the gameStats
    function updatePoints(){
        if(currentGem.value !== 0){
            doc.querySelector('.points').innerHTML = 'Points: ' + player.points;
        }else if(player.lives !== 3){
            // if the player has less than 3 lives, updated lives
            player.updateLives(1);
            updateHearts(1);
        }

        gemOnBoard = false;
    }

    // This function updates the heart icons displayed in the gameStats
    function updateHearts(life){
        if(life === -1){
            // remove heart
            doc.querySelector('.lives').children[0].remove();
        }else{
            // add heart
            let hearts = doc.querySelector('.lives'),
                heart = doc.createElement('li');
            heart.innerHTML = '<i class="fas fa-heart"></i>';
            hearts.appendChild(heart);
        }
    }

    // This function displayes the modal with winning or game over message
    function showModal(){
        clearInterval(timeInterval);
        let message = '';

        if(player.hasWon){
            message = `
                <p>Congratulations!!!</p> 
                <p>You completed the game before the time ran out!</p>
                <p>Total points: ${player.points}`;
        }else if(player.lives === 0){
            message = `
            <p>GAME OVER</p> 
            <p>You ran out of lives...</p>
            <p>But don't fret, you can always try again!</p>`;
        }else{
            message = `
            <p>GAME OVER</p> 
            <p>Oops, no more time left...</p>
            <p>Next time you better be quciker!</p>`;
        }

        doc.getElementById('modalMessage').innerHTML = message;

        modal.style.display = "block";
        isModalVisible = true;
    }

    // This function displayes the modal with game instructions
    function showInfoModal(){
        // Pause timer
        timeIsPaused = true;
        let message = `
        <p>GAME INSTRUCTIONS</p> 
        <p>Collect as many gems as you can to earn points</p>
        <p>But be careful, the ladybugs are not friendly. They will hurt you.</p>
        <p>Make sure you get to the star before the time runs out...</p>
        <p>Also, watch your lives, you certainly don't want to run out of those</p>
        <p><em>...oh, and don't go in the water, you're not a very good swimmer...</em></p>
        `;

        doc.getElementById('modalMessage').innerHTML = message;

        modal.style.display = "block";
        isModalVisible = true;
    }


    // Event listener on play again button
    doc.getElementById('playAgainBtn').addEventListener('click', function(){
        reset();
    });

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png',
        'images/char-cat-girl.png',
        'images/gem-blue.png',
        'images/gem-green.png',
        'images/gem-orange.png',
        'images/heart.png',
        'images/Selector.png',
        'images/Star.png',
        'images/question-mark.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developers can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
})(this);
