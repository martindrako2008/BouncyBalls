const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");




let gameState = "playing"; 
// playing, victory, defeat


const catImg = new Image();
catImg.src = "Jetpack_Cat.png";

let paddle = {
  width: 195,
  height: 22,
  x: canvas.width / 2 - 50,
  y: canvas.height - 40,
  speed: 16,
  dx: 0
};


// BALL


let balls = [{
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: 8,
  dx: 5,
  dy: -5
}];

let powerUps = []; // För att spåra power-ups i framtiden



// BRICKS

let bricks = [];
let explosions = []; // Spåra explosioner för visuell effekt
const rows = 8;
const cols = 17;

const brickWidth = canvas.width / cols;
const brickHeight = 30;

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {

    // 75% Chance
    if (Math.random() < 0.75) {

      bricks.push({
        x: c * brickWidth,
        y: 60 + r * brickHeight,
        width: brickWidth,
        height: brickHeight,
        hp: Math.floor(Math.random() * 3) + 1, // hp 1–3
        row: r,
        col: c
      });

    }

  }
}


// CONTROLS


document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function keyDown(e) {
  if (e.key === "ArrowRight") paddle.dx = paddle.speed;
  if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
  if ((e.code === "Space" || e.key === " ") && gameState !== "playing") {
  resetGame();
}
}

function keyUp(e) {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft")
    paddle.dx = 0;
}


// DRAW FUNCTIONS

function generateBricks(){

  bricks = [];
 

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {

      if (Math.random() < 0.75) {

        bricks.push({
          x: c * brickWidth,
          y: 60 + r * brickHeight,
          width: brickWidth,
          height: brickHeight,
          hp: Math.floor(Math.random() * 3) + 1,
          row: r,
          col: c
        });

      }

    }
  }

}

function resetGame(){

  paddle.x = canvas.width / 2 - paddle.width / 2;

  balls = [{
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 8,
    dx: 5,
    dy: -5
  }];

  powerUps = [];
  explosions = [];

  generateBricks();

  gameState = "playing";

}

function drawPaddle() {
  ctx.fillStyle = "cyan";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBalls() {

  balls.forEach(ball => {

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

  });

}


function drawBricks() {
  bricks.forEach(brick => {
    if (brick.hp > 0) {
      if (brick.hp === 3) ctx.fillStyle = "green";
      if (brick.hp === 2) ctx.fillStyle = "orange";
      if (brick.hp === 1) ctx.fillStyle = "yellow";

      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      // Show HP 
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(brick.hp, brick.x + brick.width/2 - 5, brick.y + 18);
    }
  });
}

function drawExplosions() {
  explosions.forEach((exp, index) => {
    const progress = exp.frame / exp.duration;
    const radius = 75 * (1 - progress);
    const alpha = 1 - progress;
    
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
  
  // Ta bort explosioner som är klara
  explosions = explosions.filter(exp => exp.frame < exp.duration);
}


// COLLISIONS

function explodeBrick(brick) {
  // chans för explosion
  if (Math.random() > 0.5) return;
  
  // Lägg till explosion visuell effekt
  explosions.push({
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    frame: 0,
    duration: 40 // 40 frames
  });
  
  // Skada intilliggande brick (upp, ner, vänster, höger)
  const adjacentPositions = [
    { row: brick.row - 1, col: brick.col }, // upp
    { row: brick.row + 1, col: brick.col }, // ner
    { row: brick.row, col: brick.col - 1 }, // vänster
    { row: brick.row, col: brick.col + 1 }, // höger
    { row: brick.row - 2, col: brick.col },
    { row: brick.row + 2, col: brick.col }, 
    { row: brick.row, col: brick.col - 2 }, 
    { row: brick.row, col: brick.col + 2 }  
  ];
  
  adjacentPositions.forEach(pos => {
    bricks.forEach(adjBrick => {
      if (adjBrick.hp > 0 && adjBrick.row === pos.row && adjBrick.col === pos.col) {
        adjBrick.hp--;
      }
    });
  });
}

function cloneBalls() {

  let newBalls = [];

  balls.forEach(ball => {

    newBalls.push({
      x: ball.x,
      y: ball.y,
      radius: ball.radius,
      dx: -ball.dx,
      dy: ball.dy
    });

  });

  balls = balls.concat(newBalls);

}


function updatePowerUps() {

  for (let i = powerUps.length - 1; i >= 0; i--) {

    let p = powerUps[i];

    p.y += p.dy;

    // paddle collision
    if (
      p.y + p.height/2 > paddle.y &&
      p.y - p.height/2 < paddle.y + paddle.height &&
      p.x > paddle.x &&
      p.x < paddle.x + paddle.width
    ) {

      if (p.type === "extra") {
        spawnExtraBall();
      }

      if (p.type === "clone") {
        cloneBalls();
      }

      powerUps.splice(i, 1);
      continue;
    }

    // fall off screen
    if (p.y > canvas.height) {
      powerUps.splice(i, 1);
    }

  }

}

function spawnExtraBall() {

  balls.push({
    x: paddle.x + paddle.width / 2,
    y: paddle.y - 10,
    radius: 8,
    dx: (Math.random() - 0.5) * 8,
    dy: -5
  });

}

function drawPowerUps() {

  powerUps.forEach(p => {

    ctx.fillStyle = p.type === "clone" ? "magenta" : "cyan";
    ctx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";

    if (p.type === "clone") {
      ctx.fillText("2x", p.x - 7, p.y + 5);
    } else {
      ctx.fillText("+", p.x - 4, p.y + 5);
    }

  });

}

function spawnPowerUp(brick) {

  if (Math.random() > 0.15) return;

  let types = ["extra","clone"];
  let type = types[Math.floor(Math.random()*types.length)];

  powerUps.push({
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    width: 20,
    height: 20,
    dy: 3,
    type: type
  });

}

function drawGameState(){

  if(gameState === "playing") return;

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.textAlign = "center";
  ctx.font = "60px Cursive";

  if(gameState === "victory"){

    ctx.fillStyle = "lime";
    ctx.fillText("VICTORY", canvas.width/2, canvas.height/2 - 120);



  }

  if(gameState === "defeat"){

    ctx.fillStyle = "red";
    ctx.fillText("DEFEAT", canvas.width/2, canvas.height/2 - 120);

   

    ctx.drawImage(
      catImg,
      canvas.width/2-75,
      canvas.height/2 - 90,
      150,
      150
    );

  }

  ctx.fillStyle = "white";
  ctx.font = "30px Cursive";
  ctx.fillText("Press SPACE to retry", canvas.width/2, canvas.height/2 + 95);

}

function collisionDetection() {

  balls.forEach(ball => {

    bricks.forEach(brick => {

      if (brick.hp > 0) {

        let closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        let closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

        let dx = ball.x - closestX;
        let dy = ball.y - closestY;

        if (dx * dx + dy * dy < ball.radius * ball.radius) {

          brick.hp--;

          if (brick.hp === 0) {
            spawnPowerUp(brick);
          }

          explodeBrick(brick);

          // studs
          if (Math.abs(dx) > Math.abs(dy)) {
            ball.dx *= -1.01;
          } else {
            ball.dy *= -1.01;
          }

        }

      }

    });

  });

}


// UPDATE


function update() {
  if(gameState !== "playing"){
  drawGameState();
  requestAnimationFrame(update);
  return;
}
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPaddle();
  drawBalls();
  drawBricks();
  drawExplosions(); 
  drawPowerUps();
  updatePowerUps();

  collisionDetection();
  // victory check
  if(bricks.every(b => b.hp <= 0)){
  gameState = "victory";
   }

   // defeat check
  if (balls.length === 0) {
  gameState = "defeat";
}

  // Flytta paddle
  paddle.x += paddle.dx;

  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width)
    paddle.x = canvas.width - paddle.width;

  // Flytta boll
  balls.forEach(ball => {

  ball.x += ball.dx * 1.02;
  ball.y += ball.dy * 1.02;

  // väggstuds
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0)
    ball.dx *= -1.01;

  if (ball.y - ball.radius < 0)
    ball.dy *= -1.01;

  // paddle studs
  if (
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.x + ball.radius > paddle.x &&
    ball.x - ball.radius < paddle.x + paddle.width
  ) {

    let hitPoint = ball.x - (paddle.x + paddle.width / 2);
    let normalizedHit = hitPoint / (paddle.width / 2);

    ball.dx = normalizedHit * 5;
    ball.dy = -Math.abs(ball.dy);

  }

});

  // Om bollen faller ner
balls = balls.filter(ball => ball.y < canvas.height);






  // Uppdatera explosioner
  explosions.forEach(exp => {
    exp.frame++;
  });
  drawGameState();
  requestAnimationFrame(update);
}

update();
