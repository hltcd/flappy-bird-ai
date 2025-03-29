// Game constants
const CANVAS_WIDTH = 500;  // Increased from 288
const CANVAS_HEIGHT = 700; // Increased from 512
const GRAVITY = 0.25;
const FLAP_STRENGTH = -4.6;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1500; // milliseconds
const PIPE_GAP = 150;      // Increased from 100 to maintain proportions
const GROUND_HEIGHT = 150; // Increased from 112 to maintain proportions

// Game variables
let canvas, ctx;
let frames = 0;
let score = 0;
let bestScore = 0;
let gameState = 'START'; // START, PLAYING, GAME_OVER

// Asset paths
const ASSETS = {
    background:
        'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/background-day.png',
    pipe: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/pipe-green.png',
    bird: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/yellowbird-midflap.png',
    ground: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/base.png',
    getReady:
        'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/message.png',
    gameOver:
        'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/gameover.png'
};

// Game objects
const bird = {
    x: CANVAS_WIDTH / 2 - 25, // Adjusted for new width (increased bird size)
    y: 200,                   // Adjusted for new height
    width: 50,                // Increased from 34
    height: 35,               // Increased from 24
    velocity: 0,
    rotation: 0,

    flap() {
        this.velocity = FLAP_STRENGTH;
        // Play flap sound
        flapSound.play();
    },

    update() {
        // Apply gravity
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Rotation based on velocity
        if (this.velocity <= 0) {
            this.rotation = (-25 * Math.PI) / 180; // Rotate up when flapping
        } else {
            this.rotation = Math.min(Math.PI / 2, this.velocity * 0.1); // Rotate down when falling
        }

        // Ceiling collision
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Ground collision
        if (this.y + this.height >= CANVAS_HEIGHT - GROUND_HEIGHT) {
            this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
            if (gameState === 'PLAYING') {
                gameState = 'GAME_OVER';
                hitSound.play();
            }
        }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(
            sprites.bird,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();
    },

    reset() {
        this.y = 150;
        this.velocity = 0;
        this.rotation = 0;
    }
};

const pipes = {
    position: [],

    reset() {
        this.position = [];
    },

    update() {
        // Move pipes to the left
        for (let i = 0; i < this.position.length; i++) {
            let pipe = this.position[i];
            pipe.x -= PIPE_SPEED;

            // Check if pipe is off screen
            if (pipe.x + pipe.width < 0) {
                this.position.shift();
                i--;
                continue;
            }

            // Check for collision with bird
            if (
                bird.x + bird.width > pipe.x &&
                bird.x < pipe.x + pipe.width &&
                (bird.y < pipe.y + pipe.topHeight ||
                    bird.y + bird.height > pipe.y + pipe.topHeight + PIPE_GAP)
            ) {
                if (gameState === 'PLAYING') {
                    gameState = 'GAME_OVER';
                    hitSound.play();
                }
            }

            // Check if bird passed the pipe
            if (pipe.x + pipe.width < bird.x && !pipe.passed) {
                score++;
                pipe.passed = true;
                scoreSound.play();
            }
        }

        // Spawn new pipes
        if (frames % 100 === 0 && gameState === 'PLAYING') {
            this.spawn();
        }
    },

    spawn() {
        // Calculate random gap position
        const topHeight =
            Math.floor(
                Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 180)
            ) + 40; // Adjusted values for larger canvas
        
        this.position.push({
            x: CANVAS_WIDTH,
            y: 0,
            width: 80,        // Increased from 52
            topHeight: topHeight,
            passed: false
        });
    },

    draw() {
        for (let i = 0; i < this.position.length; i++) {
            let pipe = this.position[i];

            // Draw top pipe (flipped)
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(
                sprites.pipe,
                pipe.x,
                -pipe.topHeight,
                pipe.width,
                pipe.topHeight
            );
            ctx.restore();

            // Draw bottom pipe
            ctx.drawImage(
                sprites.pipe,
                pipe.x,
                pipe.topHeight + PIPE_GAP,
                pipe.width,
                CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT
            );
        }
    }
};

const background = {
    x: 0,

    update() {
        // Slowly scroll background
        this.x = (this.x - 0.5) % CANVAS_WIDTH;
    },

    draw() {
        // Draw background twice for seamless scrolling
        ctx.drawImage(
            sprites.background,
            this.x,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );
        ctx.drawImage(
            sprites.background,
            this.x + CANVAS_WIDTH,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );
    }
};

const ground = {
    x: 0,

    update() {
        // Scroll ground at same speed as pipes
        this.x = (this.x - PIPE_SPEED) % (CANVAS_WIDTH / 2);
    },

    draw() {
        // Draw ground using the ground sprite
        const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
        ctx.drawImage(
            sprites.ground,
            this.x,
            groundY,
            CANVAS_WIDTH,
            GROUND_HEIGHT
        );
        ctx.drawImage(
            sprites.ground,
            this.x + CANVAS_WIDTH,
            groundY,
            CANVAS_WIDTH,
            GROUND_HEIGHT
        );
    }
};

// Sprites and sounds
const sprites = {};
const sounds = {};

// Sound effects
const flapSound = new Audio();
flapSound.src = 'https://archive.org/download/flappy-bird-sfx/sfx_wing.wav';

const hitSound = new Audio();
hitSound.src = 'https://archive.org/download/flappy-bird-sfx/sfx_hit.wav';

const scoreSound = new Audio();
scoreSound.src = 'https://archive.org/download/flappy-bird-sfx/sfx_point.wav';

// Load game assets
function loadAssets(callback) {
    let loadedAssets = 0;
    const totalAssets = Object.keys(ASSETS).length;

    for (const key in ASSETS) {
        sprites[key] = new Image();
        sprites[key].src = ASSETS[key];
        sprites[key].onload = function () {
            loadedAssets++;
            if (loadedAssets === totalAssets) {
                callback();
            }
        };
    }
}

// Game initialization
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Add event listeners
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Space') {
            handleInput();
        }
    });

    canvas.addEventListener('click', handleInput);

    // Load assets and start game loop
    loadAssets(function () {
        gameLoop();
    });
}

function handleInput() {
    switch (gameState) {
        case 'START':
            gameState = 'PLAYING';
            bird.flap();
            break;
        case 'PLAYING':
            bird.flap();
            break;
        case 'GAME_OVER':
            resetGame();
            gameState = 'START';
            break;
    }
}

function resetGame() {
    bird.reset();
    pipes.reset();
    if (score > bestScore) {
        bestScore = score;
    }
    score = 0;
    frames = 0;
}

// Game loop
function gameLoop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(gameLoop);
}

function update() {
    background.update();
    ground.update();

    if (gameState === 'PLAYING') {
        bird.update();
        pipes.update();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw game elements
    background.draw();
    pipes.draw();
    ground.draw();
    bird.draw();

    // Draw score
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '35px Arial';
    ctx.textAlign = 'center';

    if (gameState === 'PLAYING' || gameState === 'GAME_OVER') {
        ctx.fillText(score, CANVAS_WIDTH / 2, 50);
        ctx.strokeText(score, CANVAS_WIDTH / 2, 50);
    }

    // Draw game state screens
    if (gameState === 'START') {
        // Draw "Get Ready" message
        const getReadyImg = sprites.getReady;
        const getReadyWidth = 300;  // Increased from 184
        const getReadyHeight = 400; // Increased from 267
        ctx.drawImage(
            getReadyImg,
            CANVAS_WIDTH / 2 - getReadyWidth / 2,
            CANVAS_HEIGHT / 2 - getReadyHeight / 2,
            getReadyWidth,
            getReadyHeight
        );
    } else if (gameState === 'GAME_OVER') {
        // Draw "Game Over" message
        const gameOverImg = sprites.gameOver;
        const gameOverWidth = 350; // Increased from 230
        const gameOverHeight = 90; // Increased from 60
        ctx.drawImage(
            gameOverImg,
            CANVAS_WIDTH / 2 - gameOverWidth / 2,
            CANVAS_HEIGHT / 2 - 80, // Adjusted position
            gameOverWidth,
            gameOverHeight
        );

        // Rest of the game over screen code
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(
            `Score: ${score}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 30
        );
        ctx.strokeText(
            `Score: ${score}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 30
        );

        ctx.fillText(
            `Best: ${bestScore}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 60
        );
        ctx.strokeText(
            `Best: ${bestScore}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 60
        );

        ctx.fillText(
            'CLICK TO RESTART',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 100
        );
        ctx.strokeText(
            'CLICK TO RESTART',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 100
        );
    }
}

// Start the game when the page loads
window.onload = init;
