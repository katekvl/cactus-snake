
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const MAX_SNAKE_LENGTH = 100;
const FRAME_COLOR = '000000';
const N = 30;
const CACTUS_SCALE = 2.7;  // 80% of cell size
let cellWidth = 20;
let frameOrigin = { x: 20, y: 20 };
let apple = { x: 0, y: 0 };
let crushable = false;  // true = collisions kill
let winningScore = 15;
let winnerMessage = null;
let loop = null;
let gameStarted = false;
let isPaused = false;
let countdownSeconds = 60;
let timerInterval = null;
let timerStarted = false;
const timerInput = document.getElementById('timerInput');

// ✅ Pause countdown while editing the timer input
timerInput.addEventListener('focus', () => {
  isEditingTimer = true;
});

timerInput.addEventListener('blur', () => {
  isEditingTimer = false;
});

let isEditingTimer = false;


const cactusImage = new Image();
cactusImage.src = 'assets/outlined_cactus_logo.png'; // Adjust the path if necessary

function renderInitialState() {
    drawBackground();  // your existing background draw function
    drawFrame();     // if you have this
    drawSnakes();      // render both snakes at initial positions
    //drawApple();       // or drawCactus() or whatever item
  }  

class LogicalPoint {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class SnakeType {

    getDirectionAngle() {
        switch (this.direction) {
            case 'Right': return 0 + Math.PI / 2;
            case 'Down': return Math.PI / 2 + Math.PI / 2;
            case 'Left': return Math.PI + Math.PI / 2;
            case 'Up': return -Math.PI / 2 + Math.PI / 2;
        }
    }
    constructor(role) {
        this.bodyLength = 5;
        this.body = new Array(MAX_SNAKE_LENGTH).fill(null).map(() => new LogicalPoint());

        const startX = role === 'my' ? 5 : 25;
        const startY = role === 'my' ? 5 : 25;
        const dx = role === 'my' ? -1 : 1;

        // Initialize body so it grows left for player, right for computer
        for (let i = 0; i < this.bodyLength; i++) {
            this.body[i] = new LogicalPoint(startX + i * dx, startY);
        }

        this.colors = role === 'my'
            ? ['#99C987', '#214B35']  // light green, dark green
            : ['#D70074', '#F39200']; // magenta, orange

        this.appleCount = 0;
        this.role = role;
        this.direction = 'Right';
    }

    move() {
        for (let i = this.bodyLength - 1; i > 0; i--) {
            this.body[i].x = this.body[i - 1].x;
            this.body[i].y = this.body[i - 1].y;
        }

        let head = this.body[0];
        switch (this.direction) {
            case 'Left': head.x -= 1; break;
            case 'Right': head.x += 1; break;
            case 'Up': head.y -= 1; break;
            case 'Down': head.y += 1; break;
        }

        if (wallsPermeable) {
            if (head.x < 1) head.x = N;
            if (head.y < 1) head.y = N;
            if (head.x > N) head.x = 1;
            if (head.y > N) head.y = 1;
        } else {
            if (head.x < 1 || head.y < 1 || head.x > N || head.y > N) {
                if (this.role === 'my') {
                    alert('Game Over! You hit the wall!');
                    clearInterval(loop);
                    clearInterval(timerInterval);

                } else {
                    // Push computer back into valid range (basic handling)
                    head.x = Math.max(1, Math.min(N, head.x));
                    head.y = Math.max(1, Math.min(N, head.y));
                }
            }
        }

    }

    draw() {
        // === BODY SQUARES except head and tail ===
        for (let i = 1; i < this.bodyLength - 1; i++) {
            ctx.fillStyle = this.colors[i % 2];
            const gra_x = frameOrigin.x + (this.body[i].x - 1) * cellWidth;
            const gra_y = frameOrigin.y + (this.body[i].y - 1) * cellWidth;
            ctx.fillRect(gra_x, gra_y, cellWidth, cellWidth);

            // Add black outline
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(gra_x, gra_y, cellWidth, cellWidth);
        }

        // === ROTATED CUSTOM MUZZLE ===
        const head = this.body[0];
        const hx = frameOrigin.x + (head.x - 1) * cellWidth + cellWidth / 2;
        const hy = frameOrigin.y + (head.y - 1) * cellWidth + cellWidth / 2;
        const angle = this.getDirectionAngle();

        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(angle);

        const scale = 2.0; // big muzzle
        const w = cellWidth * scale;
        const h = cellWidth * scale;

        ctx.fillStyle = this.colors[0];
        ctx.beginPath();
        ctx.moveTo(-w * 0.3, 0);
        ctx.bezierCurveTo(
            -w * 0.3, -h * 0.3,
            -w * 0.1, -h * 0.5,
            0, -h * 0.5
        );
        ctx.bezierCurveTo(
            w * 0.1, -h * 0.5,
            w * 0.3, -h * 0.3,
            w * 0.3, 0
        );
        ctx.bezierCurveTo(
            w * 0.3, h * 0.3,
            w * 0.1, h * 0.45,
            0, h * 0.45
        );
        ctx.bezierCurveTo(
            -w * 0.1, h * 0.45,
            -w * 0.3, h * 0.3,
            -w * 0.3, 0
        );
        ctx.closePath();
        ctx.fill();

        // Muzzle outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eyes on muzzle
        ctx.fillStyle = 'black';
        const eyeOffsetX = w * 0.15;
        const eyeOffsetY = -h * 0.2;
        const eyeRadius = cellWidth * 0.08;

        ctx.beginPath();
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // === SMOOTH TAPERED TAIL ===
        const len = this.bodyLength;
        if (len >= 2) {
            const tail = this.body[len - 1];
            const prev = this.body[len - 2];

            const tx = frameOrigin.x + (tail.x - 1) * cellWidth + cellWidth / 2;
            const ty = frameOrigin.y + (tail.y - 1) * cellWidth + cellWidth / 2;

            let dx = prev.x - tail.x;
            let dy = prev.y - tail.y;

            if (dx > 1) dx = -1;
            if (dx < -1) dx = 1;
            if (dy > 1) dy = -1;
            if (dy < -1) dy = 1;

            const tailAngle = Math.atan2(dy, dx) + Math.PI;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(tailAngle);

            const wTail = cellWidth;

            ctx.fillStyle = this.colors[(len - 1) % 2];

            ctx.beginPath();
            ctx.moveTo(0, -wTail / 2); // base left
            ctx.lineTo(0, wTail / 2);  // base right
            ctx.lineTo(wTail / 2, 0);  // tip along +X
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

    }


    eatApple() {
        return equalPoints(this.body[0], apple);
    }

    updateDirectionTowardsApple() {
        const head = this.body[0];
        const dx = apple.x - head.x;
        const dy = apple.y - head.y;
      
        const directions = [];
      
        // Move in X direction first, then Y — or vice versa
        if (Math.abs(dx) > 0) {
          directions.push(dx > 0 ? 'Right' : 'Left');
        }
      
        if (Math.abs(dy) > 0) {
          directions.push(dy > 0 ? 'Down' : 'Up');
        }
      
        // Add fallback directions in case preferred ones are blocked
        const allDirs = ['Up', 'Down', 'Left', 'Right'];
        for (let dir of allDirs) {
          if (!directions.includes(dir)) {
            directions.push(dir);
          }
        }
      
        for (let dir of directions) {
          const candidate = this._nextPointFromDirection(head, dir);
          if (this._isValidMove(candidate)) {
            this.direction = dir;
            return;
          }
        }
      }
      

    // Helper to compute target point from direction
    _nextPointFromDirection(head, dir) {
        let x = head.x;
        let y = head.y;
        if (dir === 'Up') y--;
        if (dir === 'Down') y++;
        if (dir === 'Left') x--;
        if (dir === 'Right') x++;
        return new LogicalPoint(x, y);
    }

    // Check whether move is legal considering walls and self
    _isValidMove(point) {
        // Block walls if impermeable
        if (!wallsPermeable && (point.x < 1 || point.y < 1 || point.x > N || point.y > N)) {
            return false;
        }

        // Prevent running into self
        for (let i = 0; i < this.bodyLength; i++) {
            if (this.body[i].x === point.x && this.body[i].y === point.y) return false;
        }

        return true;
    }

}

function getSpeedLevelFromDelay(delay) {
    const minDelay = 10;
    const maxDelay = 1000;
    const clamped = Math.max(minDelay, Math.min(delay, maxDelay));
    const scale = 100;
  
    const level = Math.round(
      ((maxDelay - clamped) / (maxDelay - minDelay)) * (scale - 1) + 1
    ) - 50;
    return level;
  }
  

function updateSpeedDisplay() {
    document.getElementById('speedDisplay').textContent = getSpeedLevelFromDelay(computerMoveDelay);
}


function equalPoints(l, r) {
    return l.x === r.x && l.y === r.y;
}

function drawFrame() {
    const d = 0;
    ctx.strokeStyle = FRAME_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(
        frameOrigin.x - d,
        frameOrigin.y - d,
        cellWidth * N + d * 2,
        cellWidth * N + d * 2
    );
}

function drawDecorativeFramePattern() {
    const triangleSize = 20;
    const colors = ['#214B35', '#99C987', '#D70074', '#F39200'];
    let colorIndex = 0;

    const w = canvas.width;
    const h = canvas.height;

    const topCount = Math.floor(w / triangleSize);
    const sideCount = Math.floor(h / triangleSize);

    // TOP EDGE (left to right)
    for (let i = 1; i < topCount - 1; i++) {
        const x = i * triangleSize;
        const isFlipped = i % 2 !== 0;
        ctx.fillStyle = colors[colorIndex++ % colors.length];
        ctx.beginPath();
        if (!isFlipped) {
            // Right-angle at bottom-left
            ctx.moveTo(x, 0);
            ctx.lineTo(x + triangleSize, 0);
            ctx.lineTo(x, triangleSize);
        } else {
            // Right-angle at bottom-right
            ctx.moveTo(x + triangleSize, 0);
            ctx.lineTo(x + triangleSize, triangleSize);
            ctx.lineTo(x, 0);
        }
        ctx.closePath();
        ctx.fill();
    }

    // RIGHT EDGE (top to bottom, corrected)
    for (let i = 1; i < sideCount - 1; i++) {
        const y = i * triangleSize;
        const isFlipped = i % 2 !== 0;
        ctx.fillStyle = colors[colorIndex++ % colors.length];
        ctx.beginPath();
        if (!isFlipped) {
            // Right-angle at top-right
            ctx.moveTo(w, y);
            ctx.lineTo(w - triangleSize, y);
            ctx.lineTo(w, y + triangleSize);
        } else {
            // Right-angle at bottom-right
            ctx.moveTo(w, y + triangleSize);
            ctx.lineTo(w - triangleSize, y + triangleSize);
            ctx.lineTo(w, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    // BOTTOM EDGE (right to left)
    for (let i = 1; i < topCount - 1; i++) {
        const x = w - i * triangleSize;
        const isFlipped = i % 2 !== 0;
        ctx.fillStyle = colors[colorIndex++ % colors.length];
        ctx.beginPath();
        if (!isFlipped) {
            // Right-angle at top-right
            ctx.moveTo(x, h);
            ctx.lineTo(x - triangleSize, h);
            ctx.lineTo(x, h - triangleSize);
        } else {
            // Right-angle at top-left
            ctx.moveTo(x - triangleSize, h);
            ctx.lineTo(x - triangleSize, h - triangleSize);
            ctx.lineTo(x, h);
        }
        ctx.closePath();
        ctx.fill();
    }

    // LEFT EDGE (bottom to top — mirrored from right edge)
    for (let i = 1; i < sideCount - 1; i++) {
        const y = h - i * triangleSize;
        const isFlipped = i % 2 !== 0;
        ctx.fillStyle = colors[colorIndex++ % colors.length];
        ctx.beginPath();
        if (!isFlipped) {
            // Right-angle at top-left
            ctx.moveTo(0, y);
            ctx.lineTo(triangleSize, y);
            ctx.lineTo(0, y - triangleSize);
        } else {
            // Right-angle at bottom-left
            ctx.moveTo(0, y - triangleSize);
            ctx.lineTo(triangleSize, y - triangleSize);
            ctx.lineTo(0, y);
        }
        ctx.closePath();
        ctx.fill();
    }



}


function drawCactus() {
    // Where the grid cell starts
    const gra_x = frameOrigin.x + (apple.x - 1) * cellWidth;
    const gra_y = frameOrigin.y + (apple.y - 1) * cellWidth;

    // Desired cactus display size
    const cactusSize = cellWidth * CACTUS_SCALE;

    // Offset so it's centered in the cell
    const offset = (cellWidth - cactusSize) / 2;

    if (cactusImage.complete) {
        ctx.imageSmoothingEnabled = false; // keep pixel look!
        ctx.drawImage(
            cactusImage,
            gra_x + offset,
            gra_y + offset,
            cactusSize * (cactusImage.width / cactusImage.height),
            cactusSize
        );
    } else {
        cactusImage.onload = () => {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                cactusImage,
                gra_x + offset,
                gra_y + offset,
                cactusSize * (cactusImage.width / cactusImage.height),
                cactusSize
            );
        };
    }
}

function getHeadPixelPosition(snake) {
    const head = snake.body[0];
    const pixelX = frameOrigin.x + (head.x - 1) * cellWidth + cellWidth / 2;
    const pixelY = frameOrigin.y + (head.y - 1) * cellWidth + cellWidth / 2;
    return { x: pixelX, y: pixelY };
}

function isHeadTouchingCactus(snake) {
    const headPos = getHeadPixelPosition(snake);

    const cactusSize = cellWidth * CACTUS_SCALE;
    const cactusX = frameOrigin.x + (apple.x - 1) * cellWidth + cellWidth / 2;
    const cactusY = frameOrigin.y + (apple.y - 1) * cellWidth + cellWidth / 2;

    const dx = headPos.x - cactusX;
    const dy = headPos.y - cactusY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cactus radius for collision — half of cactus image
    const cactusRadius = cactusSize / 2;

    return distance < cactusRadius;
}

function drawApple(mode) {
    const gra_x = frameOrigin.x + (apple.x - 1) * cellWidth;
    const gra_y = frameOrigin.y + (apple.y - 1) * cellWidth;
    ctx.fillStyle = mode === 'show' ? 'red' : 'black';
    ctx.fillRect(gra_x, gra_y, cellWidth, cellWidth);
}

function putApple(mySnake, computerSnake) {
    let posFound = false;
    while (!posFound) {
        apple.x = Math.floor(Math.random() * (N - 2)) + 2;  // Range: [2, N-1]
apple.y = Math.floor(Math.random() * (N - 2)) + 2;  // Avoids edges

        posFound = true;
        for (let i = 0; i < mySnake.bodyLength; i++) {
            if ((mySnake.body[i].x === apple.x && mySnake.body[i].y === apple.y) ||
                (computerSnake.body[i].x === apple.x && computerSnake.body[i].y === apple.y)) {
                posFound = false;
                break;
            }
        }
    }
    drawCactus();
}

function growSnake(snake) {
    if (snake.bodyLength < MAX_SNAKE_LENGTH) {
        snake.bodyLength++;
    }
}


function drawAppleCount(snake) {
    if (snake.role === 'my') {
        document.getElementById('playerScore').textContent = 'Your score: ' + snake.appleCount;
    } else {
        document.getElementById('opponentScore').textContent = 'Opponent score: ' + snake.appleCount;
    }
}

function startCountdown() {
    if (timerStarted) return;
    timerStarted = true;
  
    timerInterval = setInterval(() => {
        if (isPaused || isEditingTimer) return;
  
      countdownSeconds--;
      if (countdownSeconds <= 0) {
        clearInterval(timerInterval);
        alert('Time is up!');
        clearInterval(loop);
        clearInterval(timerInterval);

      }
      const minutes = String(Math.floor(countdownSeconds / 60)).padStart(2, '0');
      const seconds = String(countdownSeconds % 60).padStart(2, '0');
      timerInput.value = `${minutes}:${seconds}`;
    }, 1000);
  }    

const mySnake = new SnakeType('my');
const computerSnake = new SnakeType('computer');
let computerMoveDelay = 50;  // ms, starting slower than player
let wallsPermeable = true; // default to true (wrapping allowed)
updateSpeedDisplay();
let computerTimer = 0;

putApple(mySnake, computerSnake);

function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fill whole canvas (background)
    drawDecorativeFramePattern();

    // Fill inner grid area with white
    ctx.fillStyle = '#FFF3E0';
    ctx.fillRect(
        frameOrigin.x,
        frameOrigin.y,
        cellWidth * N,
        cellWidth * N
    );

    // Draw frame border on top
    drawFrame();

    // Rest of game
    mySnake.move();
    mySnake.draw();

    computerTimer += 150;  // player speed is fixed at 150ms per tick

    if (computerTimer >= computerMoveDelay) {
        computerSnake.updateDirectionTowardsApple();
        computerSnake.move();
        computerTimer = 0;
    }
    computerSnake.draw();


    drawCactus();
    drawAppleCount(mySnake);
    drawAppleCount(computerSnake);

    if (isHeadTouchingCactus(mySnake)) {
        growSnake(mySnake);
        mySnake.appleCount++;
        if (mySnake.appleCount >= winningScore) winnerMessage = 'You won!';
        else putApple(mySnake, computerSnake);
      }
      if (isHeadTouchingCactus(computerSnake)) {
        growSnake(computerSnake);
        computerSnake.appleCount++;
        if (computerSnake.appleCount >= winningScore) winnerMessage = 'You lost!';
        else putApple(mySnake, computerSnake);
      }
      

    if (computerSnake.eatApple()) {
        growSnake(computerSnake);
        computerSnake.appleCount++;
        putApple(mySnake, computerSnake);
    }

    if (crushable) {
        for (let i = 1; i < mySnake.bodyLength; i++) {
            if (equalPoints(mySnake.body[0], mySnake.body[i])) {
                alert('Game Over! You crashed into yourself!');
                clearInterval(loop);
                clearInterval(timerInterval);

            }
        }
        for (let i = 0; i < computerSnake.bodyLength; i++) {
            if (equalPoints(mySnake.body[0], computerSnake.body[i])) {
                alert('Game Over! You crashed into the opponent!');
                clearInterval(loop);
                clearInterval(timerInterval);

            }
        }
    }

    if (crushable) {
        for (let i = 1; i < computerSnake.bodyLength; i++) {
            if (equalPoints(computerSnake.body[0], computerSnake.body[i])) {
                // Computer crashed into itself — reset it
                computerSnake.bodyLength = 5;
                computerSnake.appleCount = 0;
                const startX = 25;
                const startY = 25;
                for (let i = 0; i < computerSnake.bodyLength; i++) {
                    computerSnake.body[i] = new LogicalPoint(startX + i, startY);
                }
            }
        }

        for (let i = 0; i < mySnake.bodyLength; i++) {
            if (equalPoints(computerSnake.body[0], mySnake.body[i])) {
                // Computer crashed into player — reset
                computerSnake.bodyLength = 5;
                computerSnake.appleCount = 0;
                const startX = 25;
                const startY = 25;
                for (let i = 0; i < computerSnake.bodyLength; i++) {
                    computerSnake.body[i] = new LogicalPoint(startX + i, startY);
                }
            }
        }
    }

    if (winnerMessage) {
        // 1. Clear the cactus from canvas by moving it off-grid
        apple.x = -1;
        apple.y = -1;
      
        // 2. Redraw score and frame (optional)
        drawAppleCount(mySnake);
        drawAppleCount(computerSnake);
      
        // 3. Wait for UI to update, then show result and stop loop
        setTimeout(() => {
          alert(winnerMessage);
          clearInterval(loop);
          clearInterval(timerInterval);
        }, 50);
      }      

}

window.addEventListener('keydown', e => {
    const key = e.key;
    if (key === 'ArrowLeft' && mySnake.direction !== 'Right') mySnake.direction = 'Left';
    if (key === 'ArrowRight' && mySnake.direction !== 'Left') mySnake.direction = 'Right';
    if (key === 'ArrowUp' && mySnake.direction !== 'Down') mySnake.direction = 'Up';
    if (key === 'ArrowDown' && mySnake.direction !== 'Up') mySnake.direction = 'Down';
});

function startLoop() {
    if (!timerStarted) startCountdown();  // ← Add this!
    loop = setInterval(gameLoop, 150);
  }
  
  //startLoop();

document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('slowerBtn').addEventListener('click', () => {
    computerMoveDelay = Math.min(computerMoveDelay + 25, 500);
    updateSpeedDisplay();
});

document.getElementById('fasterBtn').addEventListener('click', () => {
    computerMoveDelay = Math.max(computerMoveDelay - 25, 0);
    updateSpeedDisplay();
});

const wallOnBtn = document.getElementById('wallOnBtn');
const wallOffBtn = document.getElementById('wallOffBtn');

function updateWallButtons() {
    if (wallsPermeable) {
        wallOnBtn.classList.add('active');
        wallOffBtn.classList.remove('active');
    } else {
        wallOnBtn.classList.remove('active');
        wallOffBtn.classList.add('active');
    }
}

wallOnBtn.addEventListener('click', () => {
    wallsPermeable = true;
    updateWallButtons();
});

wallOffBtn.addEventListener('click', () => {
    wallsPermeable = false;
    updateWallButtons();
});

// Initialize visual state on page load
updateWallButtons();

const crushOnBtn = document.getElementById('crushOnBtn');
const crushOffBtn = document.getElementById('crushOffBtn');

function updateCrushButtons() {
    if (crushable) {
        crushOnBtn.classList.add('active');
        crushOffBtn.classList.remove('active');
    } else {
        crushOnBtn.classList.remove('active');
        crushOffBtn.classList.add('active');
    }
}

crushOnBtn.addEventListener('click', () => {
    crushable = true;
    updateCrushButtons();
});

crushOffBtn.addEventListener('click', () => {
    crushable = false;
    updateCrushButtons();
});

updateCrushButtons();

const winPointInput = document.getElementById('winPointInput');
winPointInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  });  
winPointInput.addEventListener('input', () => {
    const val = parseInt(winPointInput.value);
    if (!isNaN(val) && val > 0 && val <= 100) {
        winningScore = val;
    }
});

timerInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
  });
  
  timerInput.addEventListener('input', () => {
    const parts = timerInput.value.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        countdownSeconds = minutes * 60 + seconds;
      }
    }
  });  

const pauseBtn = document.getElementById('pauseBtn');

function updatePauseButton() {
    const playIcon = pauseBtn.querySelector('.play-icon');
    const pauseIcon = pauseBtn.querySelector('.pause-icon');
    if (isPaused) {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    } else {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'flex';
    }
  }

  document.getElementById('startOverlayBtn').addEventListener('click', () => {
    document.getElementById('startOverlayBtn').classList.add('hidden');
    if (!gameStarted) {
      startLoop();
      gameStarted = true;
    }
  });  
  

pauseBtn.addEventListener('click', () => {
  if (isPaused) {
    startLoop();
    isPaused = false;
  } else {
    clearInterval(loop);
    isPaused = true;
  }
  updatePauseButton();
});

// Initialize on load
updatePauseButton();

//window.onload = () => {
//    renderInitialState();
//    drawStartButton();  // if you have a special draw or DOM for it
//  };

window.onload = () => {
    gameLoop(); // Draws the full game state once on load
  };
  

  