/* =========================================
   NEON DRIFT
   Touch + Keyboard Racing Game
========================================= */

"use strict";


/* =========================================
   DOM
========================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");

const garageScreen = document.getElementById("garageScreen");
const recordsScreen = document.getElementById("recordsScreen");

const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const scoreValue = document.getElementById("scoreValue");
const coinValue = document.getElementById("coinValue");
const speedValue = document.getElementById("speedValue");

const nitroFill = document.getElementById("nitroFill");
const nitroPercent = document.getElementById("nitroPercent");

const finalScore = document.getElementById("finalScore");
const finalCoins = document.getElementById("finalCoins");
const finalDistance = document.getElementById("finalDistance");

const highScore = document.getElementById("highScore");
const totalCoins = document.getElementById("totalCoins");
const bestDistance = document.getElementById("bestDistance");

const newRecord = document.getElementById("newRecord");
const touchHint = document.getElementById("touchHint");


/* =========================================
   BUTTONS
========================================= */

const startGameBtn = document.getElementById("startGameBtn");
const garageBtn = document.getElementById("garageBtn");
const recordsBtn = document.getElementById("recordsBtn");

const garageBackBtn = document.getElementById("garageBackBtn");
const recordsBackBtn = document.getElementById("recordsBackBtn");

const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");

const restartBtn = document.getElementById("restartBtn");
const gameOverMenuBtn = document.getElementById("gameOverMenuBtn");


/* =========================================
   CANVAS
========================================= */

let W = 0;
let H = 0;

function resizeCanvas() {

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================================
   GAME STATE
========================================= */

let gameRunning = false;
let paused = false;

let score = 0;
let coins = 0;
let distance = 0;

let speed = 0;
let nitro = 100;

let lastTime = 0;

let roadOffset = 0;

let spawnTimer = 0;
let coinTimer = 0;

let difficulty = 1;


/* =========================================
   ROAD
========================================= */

const road = {
    width: 420,
    laneCount: 3
};

function getRoadWidth() {

    return Math.min(
        road.width,
        W * 0.78
    );
}

function getRoadLeft() {

    return (
        W / 2 -
        getRoadWidth() / 2
    );
}

function getLaneWidth() {

    return getRoadWidth() / road.laneCount;
}


/* =========================================
   PLAYER
========================================= */

const player = {

    x: 0,
    y: 0,

    width: 48,
    height: 92,

    targetX: 0,

    tilt: 0,

    color: "#c9a227"
};


function resetPlayer() {

    player.width =
        Math.max(
            42,
            Math.min(58, W * 0.11)
        );

    player.height =
        player.width * 1.9;

    player.x =
        W / 2 - player.width / 2;

    player.y =
        H - player.height - 45;

    player.targetX = player.x;

    player.tilt = 0;
}


/* =========================================
   ENEMIES
========================================= */

let enemies = [];

function spawnEnemy() {

    const lane =
        Math.floor(
            Math.random() * road.laneCount
        );

    const laneWidth = getLaneWidth();

    const x =
        getRoadLeft() +
        lane * laneWidth +
        laneWidth / 2 -
        24;

    enemies.push({

        x,
        y: -120,

        width: 48,
        height: 90,

        speed:
            2.5 +
            Math.random() * 2 +
            difficulty * 0.3,

        color:
            Math.random() > 0.5
                ? "#b83245"
                : "#5b5b68"

    });
}


/* =========================================
   COINS
========================================= */

let collectibleCoins = [];

function spawnCoin() {

    const lane =
        Math.floor(
            Math.random() * road.laneCount
        );

    const laneWidth = getLaneWidth();

    const x =
        getRoadLeft() +
        lane * laneWidth +
        laneWidth / 2;

    collectibleCoins.push({

        x,
        y: -40,

        radius: 9,

        speed: 3.2 + difficulty * 0.25

    });
}


/* =========================================
   KEYBOARD
========================================= */

const keys = {
    left: false,
    right: false,
    nitro: false
};

window.addEventListener("keydown", (event) => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = true;
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = true;
    }

    if (event.code === "Space") {

        event.preventDefault();

        keys.nitro = true;
    }

    if (event.key.toLowerCase() === "p") {

        if (gameRunning) {
            togglePause();
        }
    }

});


window.addEventListener("keyup", (event) => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }

    if (event.code === "Space") {
        keys.nitro = false;
    }

});


/* =========================================
   MOBILE TOUCH CONTROL
========================================= */

let touchActive = false;

let touchStartX = 0;
let touchStartY = 0;

let lastTouchX = 0;
let lastTouchY = 0;


/*
    IMPORTANT:

    No on-screen control buttons.

    Player controls car by:
    Touch + Drag = Steering
    Swipe Up = Nitro
*/

canvas.addEventListener(
    "touchstart",
    (event) => {

        if (!gameRunning || paused) {
            return;
        }

        const touch =
            event.touches[0];

        touchActive = true;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;

        touchHint.style.opacity = "0";

        event.preventDefault();

    },
    { passive: false }
);


canvas.addEventListener(
    "touchmove",
    (event) => {

        if (
            !touchActive ||
            !gameRunning ||
            paused
        ) {
            return;
        }

        const touch =
            event.touches[0];

        const currentX = touch.clientX;
        const currentY = touch.clientY;

        const deltaX =
            currentX - lastTouchX;

        const deltaY =
            currentY - lastTouchY;

        /*
            Horizontal drag
            controls steering.
        */

        player.targetX += deltaX * 1.8;


        /*
            Swipe UP
            activates Nitro.
        */

        if (
            touchStartY - currentY > 45
        ) {

            if (nitro > 1) {
                keys.nitro = true;
            }

        }


        /*
            Swipe DOWN
            slows car.
        */

        if (
            currentY - touchStartY > 50
        ) {

            keys.nitro = false;

            speed *= 0.97;

        }


        lastTouchX = currentX;
        lastTouchY = currentY;

        event.preventDefault();

    },
    { passive: false }
);


canvas.addEventListener(
    "touchend",
    (event) => {

        touchActive = false;

        keys.nitro = false;

        event.preventDefault();

    },
    { passive: false }
);


canvas.addEventListener(
    "touchcancel",
    () => {

        touchActive = false;

        keys.nitro = false;

    }
);


/* =========================================
   MOUSE DRAG
   Useful for Desktop testing.
========================================= */

let mouseDown = false;
let mouseX = 0;

canvas.addEventListener("mousedown", (event) => {

    mouseDown = true;
    mouseX = event.clientX;

});

canvas.addEventListener("mousemove", (event) => {

    if (!mouseDown || !gameRunning || paused) {
        return;
    }

    const delta =
        event.clientX - mouseX;

    player.targetX += delta * 1.5;

    mouseX = event.clientX;

});

window.addEventListener("mouseup", () => {

    mouseDown = false;

});


/* =========================================
   START GAME
========================================= */

function startGame() {

    mainMenu.classList.remove("active");
    garageScreen.classList.remove("active");
    recordsScreen.classList.remove("active");

    gameScreen.classList.add("active");

    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");

    score = 0;
    coins = 0;
    distance = 0;

    speed = 5;
    nitro = 100;

    difficulty = 1;

    roadOffset = 0;

    spawnTimer = 0;
    coinTimer = 0;

    enemies = [];
    collectibleCoins = [];

    resetPlayer();

    gameRunning = true;
    paused = false;

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);

}


/* =========================================
   GAME LOOP
========================================= */

function gameLoop(time) {

    if (!gameRunning) {
        return;
    }

    if (paused) {
        return;
    }

    const delta =
        Math.min(
            (time - lastTime) / 16.67,
            2
        );

    lastTime = time;

    update(delta);

    draw();

    requestAnimationFrame(gameLoop);

}


/* =========================================
   UPDATE
========================================= */

function update(delta) {

    difficulty +=
        0.0004 * delta;


    /* -------------------------
       SPEED
    ------------------------- */

    let baseSpeed =
        5 + difficulty * 0.8;


    if (keys.nitro && nitro > 0) {

        speed +=
            (baseSpeed + 7 - speed) *
            0.08 *
            delta;

        nitro -=
            0.65 * delta;

    } else {

        speed +=
            (baseSpeed - speed) *
            0.05 *
            delta;

        nitro +=
            0.12 * delta;

    }


    nitro =
        Math.max(
            0,
            Math.min(100, nitro)
        );


    /* -------------------------
       Keyboard Steering
    ------------------------- */

    if (keys.left) {

        player.targetX -=
            7 * delta;

    }

    if (keys.right) {

        player.targetX +=
            7 * delta;

    }


    /* -------------------------
       Player Position
    ------------------------- */

    const roadLeft =
        getRoadLeft();

    const roadRight =
        roadLeft +
        getRoadWidth();

    const minX =
        roadLeft + 10;

    const maxX =
        roadRight -
        player.width -
        10;


    player.targetX =
        Math.max(
            minX,
            Math.min(
                maxX,
                player.targetX
            )
        );


    player.x +=
        (
            player.targetX -
            player.x
        ) *
        0.16 *
        delta;


    /* -------------------------
       Tilt
    ------------------------- */

    const difference =
        player.targetX -
        player.x;

    player.tilt =
        Math.max(
            -0.25,
            Math.min(
                0.25,
                difference * 0.02
            )
        );


    /* -------------------------
       Road Animation
    ------------------------- */

    roadOffset +=
        speed * 4 * delta;


    if (roadOffset > 80) {
        roadOffset = 0;
    }


    /* -------------------------
       Score
    ------------------------- */

    score +=
        speed * 0.15 * delta;

    distance +=
        speed * 0.08 * delta;


    /* -------------------------
       Enemy Spawn
    ------------------------- */

    spawnTimer -= delta;

    if (spawnTimer <= 0) {

        spawnEnemy();

        spawnTimer =
            Math.max(
                20,
                55 -
                difficulty * 3
            );

    }


    /* -------------------------
       Coin Spawn
    ------------------------- */

    coinTimer -= delta;

    if (coinTimer <= 0) {

        spawnCoin();

        coinTimer = 45;

    }


    /* -------------------------
       Update Enemies
    ------------------------- */

    enemies.forEach(enemy => {

        enemy.y +=
            enemy.speed *
            speed *
            0.45 *
            delta;

    });


    enemies =
        enemies.filter(
            enemy =>
                enemy.y <
                H + 150
        );


    /* -------------------------
       Update Coins
    ------------------------- */

    collectibleCoins.forEach(coin => {

        coin.y +=
            coin.speed *
            speed *
            0.45 *
            delta;

    });


    collectibleCoins =
        collectibleCoins.filter(
            coin =>
                coin.y <
                H + 50
        );


    /* -------------------------
       Collision
    ------------------------- */

    checkEnemyCollision();

    checkCoinCollision();


    /* -------------------------
       HUD
    ------------------------- */

    scoreValue.textContent =
        Math.floor(score);

    coinValue.textContent =
        coins;

    speedValue.textContent =
        Math.floor(speed * 24);

    nitroFill.style.width =
        `${nitro}%`;

    nitroPercent.textContent =
        `${Math.floor(nitro)}%`;

}


/* =========================================
   COLLISION
========================================= */

function checkEnemyCollision() {

    for (const enemy of enemies) {

        const padding = 8;

        const collision =
            player.x + padding <
                enemy.x + enemy.width - padding &&

            player.x +
                player.width -
                padding >
                enemy.x + padding &&

            player.y + padding <
                enemy.y + enemy.height - padding &&

            player.y +
                player.height -
                padding >
                enemy.y + padding;


        if (collision) {

            endGame();

            return;
        }

    }

}


/* =========================================
   COIN COLLISION
========================================= */

function checkCoinCollision() {

    collectibleCoins =
        collectibleCoins.filter(
            coin => {

                const centerX =
                    player.x +
                    player.width / 2;

                const centerY =
                    player.y +
                    player.height / 2;

                const dx =
                    centerX - coin.x;

                const dy =
                    centerY - coin.y;

                const distanceBetween =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    distanceBetween <
                    coin.radius +
                    player.width * 0.4
                ) {

                    coins += 1;

                    score += 100;

                    return false;

                }

                return true;

            }
        );

}


/* =========================================
   DRAW
========================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawBackground();

    drawRoad();

    drawCoins();

    drawEnemies();

    drawPlayer();

}


/* =========================================
   BACKGROUND
========================================= */

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(
        0,
        "#070712"
    );

    gradient.addColorStop(
        1,
        "#111118"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /*
       City lights
    */

    const cityWidth =
        Math.max(
            20,
            (W -
                getRoadWidth()) /
                2
        );


    for (
        let x = 0;
        x < cityWidth;
        x += 35
    ) {

        const buildingHeight =
            50 +
            (
                Math.sin(x * 0.7) *
                30
            );

        ctx.fillStyle =
            "rgba(255,255,255,0.025)";

        ctx.fillRect(
            x,
            H - buildingHeight,
            25,
            buildingHeight
        );

    }


    for (
        let x = getRoadLeft() + getRoadWidth();
        x < W;
        x += 35
    ) {

        const buildingHeight =
            50 +
            (
                Math.sin(x * 0.5) *
                30
            );

        ctx.fillStyle =
            "rgba(255,255,255,0.025)";

        ctx.fillRect(
            x,
            H - buildingHeight,
            25,
            buildingHeight
        );

    }

}


/* =========================================
   ROAD
========================================= */

function drawRoad() {

    const roadWidth =
        getRoadWidth();

    const left =
        getRoadLeft();


    /* Road */

    ctx.fillStyle =
        "#15151b";

    ctx.fillRect(
        left,
        0,
        roadWidth,
        H
    );


    /* Road edges */

    ctx.fillStyle =
        "#c9a227";

    ctx.fillRect(
        left,
        0,
        3,
        H
    );

    ctx.fillRect(
        left + roadWidth - 3,
        0,
        3,
        H
    );


    /* Lane markings */

    const laneWidth =
        getLaneWidth();


    ctx.fillStyle =
        "rgba(255,255,255,0.22)";


    for (
        let lane = 1;
        lane < road.laneCount;
        lane++
    ) {

        const x =
            left +
            lane *
            laneWidth;


        for (
            let y =
                -100 +
                roadOffset;

            y < H;

            y += 100
        ) {

            ctx.fillRect(
                x - 1,
                y,
                2,
                50
            );

        }

    }

}


/* =========================================
   PLAYER
========================================= */

function drawPlayer() {

    ctx.save();

    const centerX =
        player.x +
        player.width / 2;

    const centerY =
        player.y +
        player.height / 2;


    ctx.translate(
        centerX,
        centerY
    );

    ctx.rotate(
        player.tilt
    );


    /*
       Shadow
    */

    ctx.shadowColor =
        "rgba(201,162,39,0.7)";

    ctx.shadowBlur = 22;


    /*
       Main Body
    */

    ctx.fillStyle =
        player.color;

    roundRect(
        ctx,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height,
        14
    );

    ctx.fill();


    /*
       Windshield
    */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#09090d";

    roundRect(
        ctx,
        -player.width * 0.35,
        -player.height * 0.30,
        player.width * 0.70,
        player.height * 0.27,
        7
    );

    ctx.fill();


    /*
       Rear Window
    */

    ctx.fillStyle =
        "#16161e";

    roundRect(
        ctx,
        -player.width * 0.30,
        player.height * 0.10,
        player.width * 0.60,
        player.height * 0.18,
        5
    );

    ctx.fill();


    /*
       Headlights
    */

    ctx.fillStyle =
        "#fff4a8";

    ctx.fillRect(
        -player.width * 0.36,
        -player.height * 0.42,
        player.width * 0.18,
        5
    );

    ctx.fillRect(
        player.width * 0.18,
        -player.height * 0.42,
        player.width * 0.18,
        5
    );


    /*
       Nitro Glow
    */

    if (keys.nitro && nitro > 0) {

        ctx.fillStyle =
            "#fff0a0";

        ctx.shadowColor =
            "#c9a227";

        ctx.shadowBlur = 20;

        ctx.beginPath();

        ctx.moveTo(
            -player.width * 0.25,
            player.height / 2
        );

        ctx.lineTo(
            0,
            player.height / 2 + 35
        );

        ctx.lineTo(
            player.width * 0.25,
            player.height / 2
        );

        ctx.closePath();

        ctx.fill();

    }


    ctx.restore();

}


/* =========================================
   ENEMIES
========================================= */

function drawEnemies() {

    enemies.forEach(enemy => {

        ctx.save();

        ctx.translate(
            enemy.x +
                enemy.width / 2,
            enemy.y +
                enemy.height / 2
        );


        ctx.fillStyle =
            enemy.color;

        roundRect(
            ctx,
            -enemy.width / 2,
            -enemy.height / 2,
            enemy.width,
            enemy.height,
            12
        );

        ctx.fill();


        /*
           Windshield
        */

        ctx.fillStyle =
            "#09090d";

        roundRect(
            ctx,
            -enemy.width * 0.34,
            -enemy.height * 0.30,
            enemy.width * 0.68,
            enemy.height * 0.25,
            6
        );

        ctx.fill();


        /*
           Rear lights
        */

        ctx.fillStyle =
            "#ff4057";

        ctx.fillRect(
            -enemy.width * 0.35,
            enemy.height * 0.32,
            enemy.width * 0.20,
            5
        );

        ctx.fillRect(
            enemy.width * 0.15,
            enemy.height * 0.32,
            enemy.width * 0.20,
            5
        );


        ctx.restore();

    });

}


/* =========================================
   COINS
========================================= */

function drawCoins() {

    collectibleCoins.forEach(coin => {

        ctx.save();

        ctx.translate(
            coin.x,
            coin.y
        );

        ctx.shadowColor =
            "#c9a227";

        ctx.shadowBlur = 15;

        ctx.fillStyle =
            "#c9a227";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.shadowBlur = 0;

        ctx.fillStyle =
            "#fff1a1";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            coin.radius * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();

    });

}


/* =========================================
   ROUND RECT
========================================= */

function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.beginPath();

    context.moveTo(
        x + radius,
        y
    );

    context.lineTo(
        x + width - radius,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    context.lineTo(
        x + width,
        y + height - radius
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    context.lineTo(
        x + radius,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    context.lineTo(
        x,
        y + radius
    );

    context.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    context.closePath();

}


/* =========================================
   PAUSE
========================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;

    if (paused) {

        pauseScreen.classList.add("active");

    } else {

        pauseScreen.classList.remove("active");

        lastTime = performance.now();

        requestAnimationFrame(gameLoop);

    }

}


/* =========================================
   END GAME
========================================= */

function endGame() {

    gameRunning = false;

    paused = false;

    gameOverScreen.classList.add("active");

    finalScore.textContent =
        Math.floor(score);

    finalCoins.textContent =
        coins;

    finalDistance.textContent =
        Math.floor(distance) + " M";


    const oldHighScore =
        Number(
            localStorage.getItem(
                "neonDriftHighScore"
            ) || 0
        );


    const oldBestDistance =
        Number(
            localStorage.getItem(
                "neonDriftBestDistance"
            ) || 0
        );


    if (score > oldHighScore) {

        localStorage.setItem(
            "neonDriftHighScore",
            Math.floor(score)
        );

        newRecord.classList.add("show");

    } else {

        newRecord.classList.remove("show");

    }


    if (distance > oldBestDistance) {

        localStorage.setItem(
            "neonDriftBestDistance",
            Math.floor(distance)
        );

    }


    const oldCoins =
        Number(
            localStorage.getItem(
                "neonDriftCoins"
            ) || 0
        );


    localStorage.setItem(
        "neonDriftCoins",
        oldCoins + coins
    );

}


/* =========================================
   RECORDS
========================================= */

function updateRecords() {

    highScore.textContent =
        Number(
            localStorage.getItem(
                "neonDriftHighScore"
            ) || 0
        );

    totalCoins.textContent =
        Number(
            localStorage.getItem(
                "neonDriftCoins"
            ) || 0
        );

    bestDistance.textContent =
        Number(
            localStorage.getItem(
                "neonDriftBestDistance"
            ) || 0
        ) + " M";

}


/* =========================================
   MAIN MENU
========================================= */

function showMainMenu() {

    gameRunning = false;
    paused = false;

    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");

    gameScreen.classList.remove("active");
    garageScreen.classList.remove("active");
    recordsScreen.classList.remove("active");

    mainMenu.classList.add("active");

}


/* =========================================
   EVENTS
========================================= */

startGameBtn.addEventListener(
    "click",
    startGame
);


garageBtn.addEventListener(
    "click",
    () => {

        mainMenu.classList.remove("active");

        garageScreen.classList.add("active");

    }
);


recordsBtn.addEventListener(
    "click",
    () => {

        mainMenu.classList.remove("active");

        recordsScreen.classList.add("active");

        updateRecords();

    }
);


garageBackBtn.addEventListener(
    "click",
    showMainMenu
);


recordsBackBtn.addEventListener(
    "click",
    showMainMenu
);


pauseBtn.addEventListener(
    "click",
    togglePause
);


resumeBtn.addEventListener(
    "click",
    togglePause
);


pauseMenuBtn.addEventListener(
    "click",
    showMainMenu
);


restartBtn.addEventListener(
    "click",
    startGame
);


gameOverMenuBtn.addEventListener(
    "click",
    showMainMenu
);


/* =========================================
   INITIALIZE
========================================= */

resetPlayer();

updateRecords();

draw();