const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ===============================
// SCREEN ELEMENTS
// ===============================

const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");

const pauseMenu = document.getElementById("pauseMenu");
const gameOver = document.getElementById("gameOver");

const garageScreen = document.getElementById("garageScreen");
const recordsScreen = document.getElementById("recordsScreen");


// ===============================
// HUD
// ===============================

const scoreElement = document.getElementById("score");
const coinsElement = document.getElementById("coins");
const speedElement = document.getElementById("speed");

const finalScoreElement = document.getElementById("finalScore");
const finalCoinsElement = document.getElementById("finalCoins");

const bestScoreElement = document.getElementById("bestScore");
const totalCoinsElement = document.getElementById("totalCoins");
const totalRacesElement = document.getElementById("totalRaces");


// ===============================
// GAME DATA
// ===============================

let gameRunning = false;
let paused = false;

let score = 0;
let coins = 0;
let speed = 5;

let totalRaces = Number(localStorage.getItem("totalRaces")) || 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let totalCoins = Number(localStorage.getItem("totalCoins")) || 0;


// ===============================
// PLAYER
// ===============================

const player = {
    width: 45,
    height: 80,

    x: 0,
    y: 0,

    speed: 7,

    movingLeft: false,
    movingRight: false,

    nitro: false
};


// ===============================
// ROAD
// ===============================

let roadWidth;
let roadLeft;

const obstacles = [];


// ===============================
// CANVAS
// ===============================

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    roadWidth = Math.min(canvas.width * 0.62, 650);

    roadLeft = (canvas.width - roadWidth) / 2;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 150;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


// ===============================
// START GAME
// ===============================

function startGame() {

    mainMenu.classList.add("hidden");
    garageScreen.classList.add("hidden");
    recordsScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    pauseMenu.classList.add("hidden");
    gameOver.classList.add("hidden");

    score = 0;
    coins = 0;

    speed = 5;

    obstacles.length = 0;

    player.x = canvas.width / 2 - player.width / 2;

    player.movingLeft = false;
    player.movingRight = false;

    gameRunning = true;
    paused = false;

    updateHUD();

    requestAnimationFrame(gameLoop);
}


// ===============================
// DRAW BACKGROUND
// ===============================

function drawBackground() {

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
    );

    gradient.addColorStop(0, "#050505");
    gradient.addColorStop(1, "#111111");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// ===============================
// DRAW ROAD
// ===============================

let roadOffset = 0;

function drawRoad() {

    // Side area

    ctx.fillStyle = "#070707";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Road

    ctx.fillStyle = "#171717";

    ctx.fillRect(
        roadLeft,
        0,
        roadWidth,
        canvas.height
    );


    // Road borders

    ctx.fillStyle = "#c9a227";

    ctx.fillRect(
        roadLeft,
        0,
        4,
        canvas.height
    );

    ctx.fillRect(
        roadLeft + roadWidth - 4,
        0,
        4,
        canvas.height
    );


    // Lane lines

    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;

    ctx.setLineDash([40, 35]);

    roadOffset += speed;

    if (roadOffset > 75) {
        roadOffset = 0;
    }

    ctx.lineDashOffset = roadOffset;

    const lane1 = roadLeft + roadWidth / 3;
    const lane2 = roadLeft + roadWidth * 2 / 3;

    ctx.beginPath();

    ctx.moveTo(lane1, 0);
    ctx.lineTo(lane1, canvas.height);

    ctx.moveTo(lane2, 0);
    ctx.lineTo(lane2, canvas.height);

    ctx.stroke();

    ctx.setLineDash([]);
}


// ===============================
// DRAW PLAYER
// ===============================

function drawPlayer() {

    const x = player.x;
    const y = player.y;

    // Glow

    ctx.shadowColor = "#c9a227";
    ctx.shadowBlur = 20;

    // Car body

    ctx.fillStyle = "#c9a227";

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        player.width,
        player.height,
        10
    );

    ctx.fill();

    ctx.shadowBlur = 0;


    // Window

    ctx.fillStyle = "#080808";

    ctx.roundRect(
        x + 7,
        y + 12,
        player.width - 14,
        25,
        7
    );

    ctx.fill();


    // Front light

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        x + 6,
        y + 4,
        10,
        5
    );

    ctx.fillRect(
        x + player.width - 16,
        y + 4,
        10,
        5
    );


    // Back light

    ctx.fillStyle = "#ff3030";

    ctx.fillRect(
        x + 6,
        y + player.height - 9,
        10,
        5
    );

    ctx.fillRect(
        x + player.width - 16,
        y + player.height - 9,
        10,
        5
    );


    // Nitro flame

    if (player.nitro) {

        ctx.fillStyle = "#ffb000";

        ctx.beginPath();

        ctx.moveTo(x + 10, y + player.height);
        ctx.lineTo(x + 17, y + player.height + 30);
        ctx.lineTo(x + 24, y + player.height);
        ctx.fill();

        ctx.beginPath();

        ctx.moveTo(x + 25, y + player.height);
        ctx.lineTo(x + 32, y + player.height + 30);
        ctx.lineTo(x + 39, y + player.height);
        ctx.fill();
    }
}


// ===============================
// OBSTACLES
// ===============================

function createObstacle() {

    const width = 45;
    const height = 75;

    const minX = roadLeft + 15;
    const maxX = roadLeft + roadWidth - width - 15;

    const x =
        minX +
        Math.random() *
        (maxX - minX);

    obstacles.push({
        x,
        y: -height,
        width,
        height,
        speed: speed + 1
    });
}


function drawObstacles() {

    obstacles.forEach(obstacle => {

        ctx.fillStyle = "#e63946";

        ctx.shadowColor = "#e63946";
        ctx.shadowBlur = 15;

        ctx.beginPath();

        ctx.roundRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height,
            8
        );

        ctx.fill();

        ctx.shadowBlur = 0;


        // Window

        ctx.fillStyle = "#111";

        ctx.fillRect(
            obstacle.x + 7,
            obstacle.y + 12,
            obstacle.width - 14,
            22
        );


        // Lights

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            obstacle.x + 6,
            obstacle.y + 4,
            9,
            5
        );

        ctx.fillRect(
            obstacle.x + obstacle.width - 15,
            obstacle.y + 4,
            9,
            5
        );
    });
}


function updateObstacles() {

    obstacles.forEach(obstacle => {

        obstacle.y += obstacle.speed;

    });


    // Remove old obstacles

    for (let i = obstacles.length - 1; i >= 0; i--) {

        if (obstacles[i].y > canvas.height + 100) {

            obstacles.splice(i, 1);

            score += 100;
            coins += 10;
        }
    }


    // Spawn

    if (
        obstacles.length === 0 ||
        obstacles[obstacles.length - 1].y > 180
    ) {

        if (Math.random() < 0.035) {

            createObstacle();
        }
    }
}


// ===============================
// PLAYER MOVEMENT
// ===============================

function updatePlayer() {

    if (player.movingLeft) {
        player.x -= player.speed;
    }

    if (player.movingRight) {
        player.x += player.speed;
    }


    // Road boundaries

    const minX = roadLeft + 8;

    const maxX =
        roadLeft +
        roadWidth -
        player.width -
        8;


    if (player.x < minX) {
        player.x = minX;
    }

    if (player.x > maxX) {
        player.x = maxX;
    }
}


// ===============================
// COLLISION
// ===============================

function collision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


function checkCollisions() {

    for (const obstacle of obstacles) {

        if (collision(player, obstacle)) {

            endGame();

            return;
        }
    }
}


// ===============================
// SCORE
// ===============================

function updateScore() {

    score += Math.floor(speed);

    if (player.nitro) {
        score += 2;
    }


    // Gradually increase speed

    if (score % 1000 < 10) {

        speed += 0.01;
    }
}


// ===============================
// HUD
// ===============================

function updateHUD() {

    scoreElement.textContent =
        Math.floor(score);

    coinsElement.textContent =
        coins;

    speedElement.textContent =
        Math.floor(speed * 20);
}


// ===============================
// GAME LOOP
// ===============================

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    if (paused) {
        return;
    }


    drawBackground();

    drawRoad();

    updatePlayer();

    updateObstacles();

    drawObstacles();

    drawPlayer();

    checkCollisions();

    updateScore();

    updateHUD();


    requestAnimationFrame(gameLoop);
}


// ===============================
// END GAME
// ===============================

function endGame() {

    gameRunning = false;

    totalRaces++;

    totalCoins += coins;

    if (score > bestScore) {
        bestScore = Math.floor(score);
    }


    localStorage.setItem(
        "bestScore",
        bestScore
    );

    localStorage.setItem(
        "totalCoins",
        totalCoins
    );

    localStorage.setItem(
        "totalRaces",
        totalRaces
    );


    finalScoreElement.textContent =
        Math.floor(score);

    finalCoinsElement.textContent =
        coins;


    gameOver.classList.remove("hidden");
}


// ===============================
// PAUSE
// ===============================

function pauseGame() {

    if (!gameRunning) {
        return;
    }

    paused = true;

    pauseMenu.classList.remove("hidden");
}


function resumeGame() {

    paused = false;

    pauseMenu.classList.add("hidden");

    requestAnimationFrame(gameLoop);
}


// ===============================
// MAIN MENU
// ===============================

function showMainMenu() {

    gameRunning = false;
    paused = false;

    gameScreen.classList.add("hidden");

    pauseMenu.classList.add("hidden");
    gameOver.classList.add("hidden");

    garageScreen.classList.add("hidden");
    recordsScreen.classList.add("hidden");

    mainMenu.classList.remove("hidden");
}


// ===============================
// GARAGE
// ===============================

function showGarage() {

    mainMenu.classList.add("hidden");

    garageScreen.classList.remove("hidden");
}


// ===============================
// RECORDS
// ===============================

function showRecords() {

    mainMenu.classList.add("hidden");

    bestScoreElement.textContent =
        bestScore;

    totalCoinsElement.textContent =
        totalCoins;

    totalRacesElement.textContent =
        totalRaces;

    recordsScreen.classList.remove("hidden");
}


// ===============================
// KEYBOARD
// ===============================

window.addEventListener("keydown", event => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        player.movingLeft = true;
    }


    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        player.movingRight = true;
    }


    if (event.code === "Space") {

        player.nitro = true;

        event.preventDefault();
    }


    if (
        event.key.toLowerCase() === "p" &&
        gameRunning
    ) {

        if (paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});


window.addEventListener("keyup", event => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        player.movingLeft = false;
    }


    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        player.movingRight = false;
    }


    if (event.code === "Space") {

        player.nitro = false;
    }
});


// ===============================
// MOBILE CONTROLS
// ===============================

function buttonControl(button, start, end) {

    button.addEventListener("pointerdown", event => {

        event.preventDefault();

        start();
    });

    button.addEventListener("pointerup", event => {

        event.preventDefault();

        end();
    });

    button.addEventListener("pointerleave", end);

    button.addEventListener("pointercancel", end);
}


buttonControl(
    document.getElementById("leftBtn"),
    () => player.movingLeft = true,
    () => player.movingLeft = false
);


buttonControl(
    document.getElementById("rightBtn"),
    () => player.movingRight = true,
    () => player.movingRight = false
);


buttonControl(
    document.getElementById("nitroBtn"),
    () => player.nitro = true,
    () => player.nitro = false
);


// ===============================
// BUTTON EVENTS
// ===============================

document.getElementById("playBtn")
    .addEventListener("click", startGame);


document.getElementById("garageBtn")
    .addEventListener("click", showGarage);


document.getElementById("recordsBtn")
    .addEventListener("click", showRecords);


document.getElementById("garageBack")
    .addEventListener("click", showMainMenu);


document.getElementById("recordsBack")
    .addEventListener("click", showMainMenu);


document.getElementById("pauseBtn")
    .addEventListener("click", pauseGame);


document.getElementById("resumeBtn")
    .addEventListener("click", resumeGame);


document.getElementById("restartBtn")
    .addEventListener("click", startGame);


document.getElementById("pauseHomeBtn")
    .addEventListener("click", showMainMenu);


document.getElementById("playAgainBtn")
    .addEventListener("click", startGame);


document.getElementById("homeBtn")
    .addEventListener("click", showMainMenu);