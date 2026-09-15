"use strict";

/* =========================================
   DOM
========================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const mainMenu =
    document.getElementById("mainMenu");

const gameScreen =
    document.getElementById("gameScreen");

const garageScreen =
    document.getElementById("garageScreen");

const recordsScreen =
    document.getElementById("recordsScreen");

const pauseScreen =
    document.getElementById("pauseScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const touchArea =
    document.getElementById("touchArea");


/* =========================================
   HUD
========================================= */

const scoreValue =
    document.getElementById("scoreValue");

const coinValue =
    document.getElementById("coinValue");

const speedValue =
    document.getElementById("speedValue");

const nitroFill =
    document.getElementById("nitroFill");

const nitroPercent =
    document.getElementById("nitroPercent");


/* =========================================
   RESULT
========================================= */

const finalScore =
    document.getElementById("finalScore");

const finalCoins =
    document.getElementById("finalCoins");

const finalDistance =
    document.getElementById("finalDistance");

const newRecord =
    document.getElementById("newRecord");


/* =========================================
   BUTTONS
========================================= */

const startGameBtn =
    document.getElementById("startGameBtn");

const garageBtn =
    document.getElementById("garageBtn");

const recordsBtn =
    document.getElementById("recordsBtn");

const garageBackBtn =
    document.getElementById("garageBackBtn");

const recordsBackBtn =
    document.getElementById("recordsBackBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const resumeBtn =
    document.getElementById("resumeBtn");

const pauseMenuBtn =
    document.getElementById("pauseMenuBtn");

const restartBtn =
    document.getElementById("restartBtn");

const gameOverMenuBtn =
    document.getElementById("gameOverMenuBtn");


/* =========================================
   CONTROL BUTTONS
========================================= */

const leftBtn =
    document.getElementById("leftBtn");

const rightBtn =
    document.getElementById("rightBtn");

const nitroBtn =
    document.getElementById("nitroBtn");


/* =========================================
   CANVAS
========================================= */

let W = 0;
let H = 0;

function resizeCanvas() {

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width =
        W * dpr;

    canvas.height =
        H * dpr;

    canvas.style.width =
        `${W}px`;

    canvas.style.height =
        `${H}px`;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================
   ROAD
========================================= */

const road = {

    width: 430,

    lanes: 3

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

    return (
        getRoadWidth() /
        road.lanes
    );

}


/* =========================================
   GAME STATE
========================================= */

let gameRunning = false;

let paused = false;

let score = 0;

let coins = 0;

let distance = 0;

let speed = 5;

let nitro = 100;

let difficulty = 1;

let roadOffset = 0;

let enemyTimer = 0;

let coinTimer = 0;

let animationId = null;

let lastTime = 0;


/* =========================================
   PLAYER
========================================= */

const player = {

    x: 0,

    y: 0,

    width: 50,

    height: 95,

    targetX: 0,

    tilt: 0

};


function resetPlayer() {

    player.width =
        Math.max(
            44,
            Math.min(
                58,
                W * 0.11
            )
        );

    player.height =
        player.width * 1.9;

    player.x =
        W / 2 -
        player.width / 2;

    player.targetX =
        player.x;

    player.y =
        H -
        player.height -
        45;

    player.tilt = 0;

}


/* =========================================
   ENEMIES
========================================= */

let enemies = [];


function spawnEnemy() {

    const lane =
        Math.floor(
            Math.random() *
            road.lanes
        );

    const laneWidth =
        getLaneWidth();

    const width = 48;

    const x =
        getRoadLeft() +
        lane * laneWidth +
        laneWidth / 2 -
        width / 2;

    enemies.push({

        x,

        y: -120,

        width,

        height: 92,

        speed:
            2.5 +
            Math.random() * 1.8 +
            difficulty * 0.25,

        color:
            Math.random() > 0.5
                ? "#a93448"
                : "#555562"

    });

}


/* =========================================
   COINS
========================================= */

let collectibles = [];


function spawnCoin() {

    const lane =
        Math.floor(
            Math.random() *
            road.lanes
        );

    const laneWidth =
        getLaneWidth();

    const x =
        getRoadLeft() +
        lane * laneWidth +
        laneWidth / 2;

    collectibles.push({

        x,

        y: -30,

        radius: 9,

        speed: 3

    });

}


/* =========================================
   KEYBOARD
========================================= */

const input = {

    left: false,

    right: false,

    nitro: false

};


window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            key === "a" ||
            event.key === "ArrowLeft"
        ) {

            input.left = true;

        }

        if (
            key === "d" ||
            event.key === "ArrowRight"
        ) {

            input.right = true;

        }

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            input.nitro = true;

        }

        if (key === "p") {

            togglePause();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            key === "a" ||
            event.key === "ArrowLeft"
        ) {

            input.left = false;

        }

        if (
            key === "d" ||
            event.key === "ArrowRight"
        ) {

            input.right = false;

        }

        if (
            event.code === "Space"
        ) {

            input.nitro = false;

        }

    }
);


/* =========================================
   MOBILE TOUCH
========================================= */

let touchActive = false;

let touchStartX = 0;

let touchStartY = 0;

let lastTouchX = 0;


touchArea.addEventListener(
    "touchstart",
    event => {

        if (
            !gameRunning ||
            paused
        ) {
            return;
        }

        const touch =
            event.touches[0];

        touchActive = true;

        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;

        lastTouchX =
            touch.clientX;

        event.preventDefault();

    },
    {
        passive: false
    }
);


touchArea.addEventListener(
    "touchmove",
    event => {

        if (
            !touchActive ||
            !gameRunning ||
            paused
        ) {
            return;
        }

        const touch =
            event.touches[0];

        const currentX =
            touch.clientX;

        const currentY =
            touch.clientY;


        /* =========================
           DRAG LEFT / RIGHT
        ========================== */

        const deltaX =
            currentX -
            lastTouchX;

        player.targetX +=
            deltaX * 2.5;


        /* =========================
           SWIPE UP = NITRO
        ========================== */

        const swipeUp =
            touchStartY -
            currentY;

        if (
            swipeUp > 45 &&
            nitro > 0
        ) {

            input.nitro = true;

        }


        lastTouchX =
            currentX;

        event.preventDefault();

    },
    {
        passive: false
    }
);


touchArea.addEventListener(
    "touchend",
    event => {

        touchActive = false;

        input.nitro = false;

        event.preventDefault();

    },
    {
        passive: false
    }
);


touchArea.addEventListener(
    "touchcancel",
    () => {

        touchActive = false;

        input.nitro = false;

    }
);


/* =========================================
   MOBILE BUTTONS
========================================= */

function holdButton(
    button,
    property
) {

    const start = event => {

        event.preventDefault();

        input[property] = true;

        button.classList.add("active");

    };

    const end = event => {

        event.preventDefault();

        input[property] = false;

        button.classList.remove("active");

    };


    button.addEventListener(
        "touchstart",
        start,
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchend",
        end,
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchcancel",
        end,
        {
            passive: false
        }
    );


    /*
       Mouse support
    */

    button.addEventListener(
        "mousedown",
        start
    );

    button.addEventListener(
        "mouseup",
        end
    );

    button.addEventListener(
        "mouseleave",
        end
    );

}


holdButton(
    leftBtn,
    "left"
);

holdButton(
    rightBtn,
    "right"
);

holdButton(
    nitroBtn,
    "nitro"
);


/* =========================================
   START GAME
========================================= */

function startGame() {

    mainMenu.classList.remove(
        "active"
    );

    garageScreen.classList.remove(
        "active"
    );

    recordsScreen.classList.remove(
        "active"
    );

    gameOverScreen.classList.remove(
        "active"
    );

    pauseScreen.classList.remove(
        "active"
    );

    gameScreen.classList.add(
        "active"
    );


    score = 0;

    coins = 0;

    distance = 0;

    speed = 5;

    nitro = 100;

    difficulty = 1;

    roadOffset = 0;

    enemyTimer = 0;

    coinTimer = 0;

    enemies = [];

    collectibles = [];


    input.left = false;

    input.right = false;

    input.nitro = false;


    resetPlayer();


    gameRunning = true;

    paused = false;


    lastTime =
        performance.now();


    if (animationId) {

        cancelAnimationFrame(
            animationId
        );

    }


    animationId =
        requestAnimationFrame(
            gameLoop
        );

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
            (time - lastTime) /
                16.67,
            2
        );


    lastTime = time;


    update(delta);

    draw();


    animationId =
        requestAnimationFrame(
            gameLoop
        );

}


/* =========================================
   UPDATE
========================================= */

function update(delta) {

    difficulty +=
        0.00035 *
        delta;


    /* =========================
       SPEED
    ========================== */

    const normalSpeed =
        5 +
        difficulty *
        0.75;


    if (
        input.nitro &&
        nitro > 0
    ) {

        speed +=
            (
                normalSpeed +
                7 -
                speed
            ) *
            0.08 *
            delta;

        nitro -=
            0.65 *
            delta;

    } else {

        speed +=
            (
                normalSpeed -
                speed
            ) *
            0.05 *
            delta;

        nitro +=
            0.12 *
            delta;

    }


    nitro =
        Math.max(
            0,
            Math.min(
                100,
                nitro
            )
        );


    /* =========================
       KEYBOARD / BUTTON STEERING
    ========================== */

    if (input.left) {

        player.targetX -=
            8 *
            delta;

    }

    if (input.right) {

        player.targetX +=
            8 *
            delta;

    }


    /* =========================
       ROAD BOUNDARY
    ========================== */

    const left =
        getRoadLeft();

    const right =
        left +
        getRoadWidth();


    const minX =
        left + 8;

    const maxX =
        right -
        player.width -
        8;


    player.targetX =
        Math.max(
            minX,
            Math.min(
                maxX,
                player.targetX
            )
        );


    /* =========================
       SMOOTH MOVEMENT
    ========================== */

    player.x +=
        (
            player.targetX -
            player.x
        ) *
        0.18 *
        delta;


    /* =========================
       CAR TILT
    ========================== */

    const movement =
        player.targetX -
        player.x;

    player.tilt =
        Math.max(
            -0.22,
            Math.min(
                0.22,
                movement * 0.018
            )
        );


    /* =========================
       ROAD
    ========================== */

    roadOffset +=
        speed *
        4 *
        delta;


    if (
        roadOffset >
        100
    ) {

        roadOffset = 0;

    }


    /* =========================
       SCORE
    ========================== */

    score +=
        speed *
        0.14 *
        delta;


    distance +=
        speed *
        0.08 *
        delta;


    /* =========================
       ENEMY SPAWN
    ========================== */

    enemyTimer -= delta;


    if (
        enemyTimer <= 0
    ) {

        spawnEnemy();

        enemyTimer =
            Math.max(
                20,
                55 -
                difficulty *
                3
            );

    }


    /* =========================
       COIN SPAWN
    ========================== */

    coinTimer -= delta;


    if (
        coinTimer <= 0
    ) {

        spawnCoin();

        coinTimer = 45;

    }


    /* =========================
       ENEMY UPDATE
    ========================== */

    enemies.forEach(
        enemy => {

            enemy.y +=
                enemy.speed *
                speed *
                0.45 *
                delta;

        }
    );


    enemies =
        enemies.filter(
            enemy =>
                enemy.y <
                H + 150
        );


    /* =========================
       COIN UPDATE
    ========================== */

    collectibles.forEach(
        coin => {

            coin.y +=
                coin.speed *
                speed *
                0.45 *
                delta;

        }
    );


    collectibles =
        collectibles.filter(
            coin =>
                coin.y <
                H + 50
        );


    /* =========================
       COLLISIONS
    ========================== */

    checkEnemyCollision();

    checkCoinCollision();


    /* =========================
       HUD
    ========================== */

    scoreValue.textContent =
        Math.floor(score);

    coinValue.textContent =
        coins;

    speedValue.textContent =
        Math.floor(
            speed * 24
        );

    nitroFill.style.width =
        `${nitro}%`;

    nitroPercent.textContent =
        `${Math.floor(nitro)}%`;

}


/* =========================================
   ENEMY COLLISION
========================================= */

function checkEnemyCollision() {

    for (
        const enemy of enemies
    ) {

        const padding = 8;


        const collision =

            player.x +
                padding <
                enemy.x +
                enemy.width -
                padding &&

            player.x +
                player.width -
                padding >
                enemy.x +
                padding &&

            player.y +
                padding <
                enemy.y +
                enemy.height -
                padding &&

            player.y +
                player.height -
                padding >
                enemy.y +
                padding;


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

    collectibles =
        collectibles.filter(
            coin => {

                const centerX =
                    player.x +
                    player.width / 2;

                const centerY =
                    player.y +
                    player.height / 2;


                const dx =
                    centerX -
                    coin.x;

                const dy =
                    centerY -
                    coin.y;


                const d =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    d <
                    coin.radius +
                    player.width *
                    0.4
                ) {

                    coins++;

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


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* City */

    const roadLeft =
        getRoadLeft();

    const roadWidth =
        getRoadWidth();


    for (
        let x = 0;
        x < roadLeft;
        x += 32
    ) {

        const height =
            60 +
            Math.abs(
                Math.sin(x * 0.4)
            ) *
            100;


        ctx.fillStyle =
            "rgba(255,255,255,0.025)";


        ctx.fillRect(
            x,
            H - height,
            24,
            height
        );

    }


    for (
        let x =
            roadLeft +
            roadWidth;

        x < W;

        x += 32
    ) {

        const height =
            60 +
            Math.abs(
                Math.sin(x * 0.3)
            ) *
            100;


        ctx.fillStyle =
            "rgba(255,255,255,0.025)";


        ctx.fillRect(
            x,
            H - height,
            24,
            height
        );

    }

}


/* =========================================
   ROAD
========================================= */

function drawRoad() {

    const width =
        getRoadWidth();

    const left =
        getRoadLeft();


    /* Road */

    ctx.fillStyle =
        "#15151b";


    ctx.fillRect(
        left,
        0,
        width,
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
        left +
            width -
            3,
        0,
        3,
        H
    );


    /* Lane lines */

    const laneWidth =
        getLaneWidth();


    ctx.fillStyle =
        "rgba(255,255,255,0.2)";


    for (
        let lane = 1;
        lane < road.lanes;
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


    /* Glow */

    ctx.shadowColor =
        "rgba(201,162,39,0.75)";

    ctx.shadowBlur = 20;


    /* Body */

    ctx.fillStyle =
        "#c9a227";


    roundedRect(
        ctx,

        -player.width / 2,

        -player.height / 2,

        player.width,

        player.height,

        14
    );


    ctx.fill();


    /* Glass */

    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#08080c";


    roundedRect(
        ctx,

        -player.width * 0.34,

        -player.height * 0.30,

        player.width * 0.68,

        player.height * 0.25,

        7
    );


    ctx.fill();


    /* Rear window */

    ctx.fillStyle =
        "#17171f";


    roundedRect(
        ctx,

        -player.width * 0.30,

        player.height * 0.08,

        player.width * 0.60,

        player.height * 0.18,

        5
    );


    ctx.fill();


    /* Headlights */

    ctx.fillStyle =
        "#fff1a1";


    ctx.fillRect(
        -player.width * 0.36,

        -player.height * 0.43,

        player.width * 0.18,

        5
    );


    ctx.fillRect(
        player.width * 0.18,

        -player.height * 0.43,

        player.width * 0.18,

        5
    );


    /* Nitro */

    if (
        input.nitro &&
        nitro > 0
    ) {

        ctx.fillStyle =
            "#fff0a0";

        ctx.shadowColor =
            "#c9a227";

        ctx.shadowBlur =
            22;


        ctx.beginPath();

        ctx.moveTo(
            -player.width * 0.24,
            player.height / 2
        );

        ctx.lineTo(
            0,
            player.height / 2 + 35
        );

        ctx.lineTo(
            player.width * 0.24,
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

    enemies.forEach(
        enemy => {

            ctx.save();


            ctx.translate(
                enemy.x +
                    enemy.width / 2,

                enemy.y +
                    enemy.height / 2
            );


            ctx.fillStyle =
                enemy.color;


            roundedRect(
                ctx,

                -enemy.width / 2,

                -enemy.height / 2,

                enemy.width,

                enemy.height,

                12
            );


            ctx.fill();


            /* Window */

            ctx.fillStyle =
                "#09090d";


            roundedRect(
                ctx,

                -enemy.width * 0.34,

                -enemy.height * 0.30,

                enemy.width * 0.68,

                enemy.height * 0.25,

                6
            );


            ctx.fill();


            /* Rear lights */

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

        }
    );

}


/* =========================================
   COINS
========================================= */

function drawCoins() {

    collectibles.forEach(
        coin => {

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
                coin.radius * 0.5,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.restore();

        }
    );

}


/* =========================================
   ROUNDED RECT
========================================= */

function roundedRect(
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


    paused =
        !paused;


    if (paused) {

        pauseScreen.classList.add(
            "active"
        );

    } else {

        pauseScreen.classList.remove(
            "active"
        );

        lastTime =
            performance.now();

        animationId =
            requestAnimationFrame(
                gameLoop
            );

    }

}


/* =========================================
   GAME OVER
========================================= */

function endGame() {

    gameRunning = false;

    paused = false;


    gameOverScreen.classList.add(
        "active"
    );


    finalScore.textContent =
        Math.floor(score);


    finalCoins.textContent =
        coins;


    finalDistance.textContent =
        `${Math.floor(distance)} M`;


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


    if (
        score >
        oldHighScore
    ) {

        localStorage.setItem(
            "neonDriftHighScore",
            Math.floor(score)
        );

        newRecord.classList.add(
            "show"
        );

    } else {

        newRecord.classList.remove(
            "show"
        );

    }


    if (
        distance >
        oldBestDistance
    ) {

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


    pauseScreen.classList.remove(
        "active"
    );

    gameOverScreen.classList.remove(
        "active"
    );

    gameScreen.classList.remove(
        "active"
    );

    garageScreen.classList.remove(
        "active"
    );

    recordsScreen.classList.remove(
        "active"
    );

    mainMenu.classList.add(
        "active"
    );

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

        mainMenu.classList.remove(
            "active"
        );

        garageScreen.classList.add(
            "active"
        );

    }
);


recordsBtn.addEventListener(
    "click",
    () => {

        mainMenu.classList.remove(
            "active"
        );

        recordsScreen.classList.add(
            "active"
        );

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