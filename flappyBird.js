const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pipeWidth = 100;
const pipeGap = 200;
const pipeVelocity = 2;
const pipes = [];

let score = 0;

function isColliding(pipe) {
  return (
    bird.x + bird.radius > pipe.x &&
    bird.x - bird.radius < pipe.x + pipe.width &&
    bird.y + bird.radius > pipe.y &&
    bird.y - bird.radius < pipe.y + pipe.height
  );
}

function drawScore() {
  ctx.font = '32px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText('Score: ' + score, 10, 40);
}

function updateScore() {
  if (pipes.length > 0 && pipes[0].x + pipeWidth < bird.x - bird.radius && !pipes[0].passed) {
    pipes[0].passed = true;
    score += 1;
  }
}

let bird = {
  x: canvas.width / 4,
  y: canvas.height / 2,
  radius: 15,
  velocity: 0,
  gravity: 0.5,
};

function drawBird() {
  ctx.beginPath();
  ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2, false);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();
}

function generatePipes() {
  const yPos = Math.floor(Math.random() * (canvas.height / 2)) + (canvas.height / 4);
  const topPipe = {
    x: canvas.width,
    y: yPos - canvas.height,
    width: pipeWidth,
    height: canvas.height,
  };
  const bottomPipe = {
    x: canvas.width,
    y: yPos + pipeGap,
    width: pipeWidth,
    height: canvas.height,
  };
  pipes.push(topPipe);
  pipes.push(bottomPipe);
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.beginPath();
    ctx.rect(pipe.x, pipe.y, pipe.width, pipe.height);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.closePath();
  });
}

function updatePipes() {
  pipes.forEach((pipe) => {
    pipe.x -= pipeVelocity;
  });

  if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    pipes.shift();
  }

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeWidth * 3) {
    generatePipes();
  }
}

let episodeCount = 0;

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePipes();
  drawPipes();

  const currentState = getState();
  if (prevState !== null) {
    const reward = pipes.some(isColliding) ? -1000 : 1;
    updateQTable(prevState, prevAction, currentState, reward);
  }

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  const action = chooseAction(currentState);
  if (action === 0) {
    jump();
  }

  prevState = currentState;
  prevAction = action;

  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    // Reset the game
    score = 0;
    pipes.length = 0;
    prevState = null;
    episodeCount++;

    // Decay epsilon
    epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);

    if (episodeCount % 100 === 0) {
      console.log('Episode:', episodeCount, 'Score:', score);
    }
  }

  if (pipes.some(isColliding)) {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    // Reset the game
    score = 0;
    pipes.length = 0;
    prevState = null;
    episodeCount++;

    // Decay epsilon
    epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);

    if (episodeCount % 100 === 0) {
      console.log('Episode:', episodeCount, 'Score:', score);
    }
  }

  updateScore();
  drawScore();
  drawBird();
  requestAnimationFrame(update);
}



function jump() {
  bird.velocity = -8;
}

document.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    jump();
  }
});


// machine learning stuff

    // Define the number of discrete states for each variable
function getState() {
  const nextPipe = pipes.find((pipe) => pipe.x + pipe.width > bird.x);
  const birdY = bird.y;
  const verticalDistance = nextPipe ? nextPipe.y + (nextPipe.height / 2) - birdY : 0;
  const horizontalDistance = nextPipe ? nextPipe.x - bird.x : 0;

  return [birdY, verticalDistance, horizontalDistance];
}

const yStates = 10;
const vDistStates = 10;
const hDistStates = 10;


    // Create an empty Q-table
const qTable = new Array(yStates * vDistStates * hDistStates)
  .fill(null)
  .map(() => new Array(2).fill(0));



    // Helper function to convert a continuous state variable to a discrete one
function discretize(value, minValue, maxValue, numStates) {
  const interval = (maxValue - minValue) / numStates;
  return Math.max(0, Math.min(Math.floor((value - minValue) / interval), numStates - 1));
}

const alpha = 0.1; // learning rate
const gamma = 0.99; // discount factor
const isTraining = false; // Set to true for training and false for testing

// The previous state and action
let prevState = null;
let prevAction = null;

function chooseAction(state) {
  // Use epsilon-greedy exploration strategy
  if (Math.random() < epsilon) {
    return Math.random() < 0.5 ? 0 : 1;
  }

  const stateIndex = getStateIndex(state);
  return qTable[stateIndex][0] > qTable[stateIndex][1] ? 0 : 1;
}

function updateQTable(prevState, prevAction, nextState, reward) {
  const prevStateIndex = getStateIndex(prevState);
  const nextStateIndex = getStateIndex(nextState);

  // Q-learning formula
  qTable[prevStateIndex][prevAction] += alpha * (reward + gamma * Math.max(...qTable[nextStateIndex]) - qTable[prevStateIndex][prevAction]);
}

function getStateIndex(state) {
  const [y, vDist, hDist] = state;
  const yIndex = discretize(y, 0, canvas.height, yStates);
  const vDistIndex = discretize(vDist, -canvas.height / 2, canvas.height / 2, vDistStates);
  const hDistIndex = discretize(hDist, 0, canvas.width, hDistStates);

  return yIndex * vDistStates * hDistStates + vDistIndex * hDistStates + hDistIndex;
}

let epsilon = isTraining ? 1.0 : 0;

const minEpsilon = 0.01; // The minimum exploration rate value our AI will reach
const epsilonDecay = 0.995; // The factor by which epsilon will be multiplied in each episode


  // machine learning stuff


update();
