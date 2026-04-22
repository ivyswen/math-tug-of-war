export function getDifficultyRange(difficulty = 'easy') {
  switch (difficulty) {
    case 'medium':
      return { min: 10, max: 50 };
    case 'hard':
      return { min: 30, max: 100 };
    case 'easy':
    default:
      return { min: 1, max: 10 };
  }
}

export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickRandomOperation(selectedOperations = ['+'], rng = Math.random) {
  const ops = Array.from(selectedOperations);
  if (!ops.length) return '+';
  if (ops.length === 1) return ops[0];
  return ops[Math.floor(rng() * ops.length)];
}

export function generateProblem({
  difficulty = 'easy',
  selectedOperations = ['+'],
  rng = Math.random,
}) {
  const { min, max } = getDifficultyRange(difficulty);
  const operator = pickRandomOperation(selectedOperations, rng);

  let a;
  let b;
  let answer;
  let text;

  switch (operator) {
    case '-': {
      a = randomInt(min, max, rng);
      b = randomInt(min, max, rng);
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      text = `${a} - ${b} = ?`;
      break;
    }
    case '*': {
      a = randomInt(min, max, rng);
      b = randomInt(min, max, rng);
      answer = a * b;
      text = `${a} × ${b} = ?`;
      break;
    }
    case '/': {
      b = randomInt(min, max, rng);
      const maxQuotient = Math.max(1, Math.floor(max / b));
      answer = randomInt(1, maxQuotient, rng);
      a = b * answer;
      text = `${a} ÷ ${b} = ?`;
      break;
    }
    case '+':
    default: {
      a = randomInt(min, max, rng);
      b = randomInt(min, max, rng);
      answer = a + b;
      text = `${a} + ${b} = ?`;
      break;
    }
  }

  return { answer, operator, text };
}

export function clampRopePosition(position, maxOffset = 250) {
  return Math.max(-maxOffset, Math.min(maxOffset, position));
}

export function hasWinner({ scores, position, winLimit, winByScore }) {
  return (
    Math.abs(position) >= winLimit ||
    scores.left >= winByScore ||
    scores.right >= winByScore
  );
}

export function getWinnerSide({ scores, position, winByScore }) {
  if (scores.left >= winByScore) return 'left';
  if (scores.right >= winByScore) return 'right';
  return position < 0 ? 'left' : 'right';
}

export function evaluateSubmission({
  side,
  rawInput,
  correctAnswer,
  scores,
  position,
  step,
  wrongStepFactor,
}) {
  const userAnswer = String(rawInput || '').trim() === '' ? NaN : parseInt(String(rawInput).trim(), 10);
  const nextScores = { ...scores };

  if (!Number.isNaN(userAnswer) && userAnswer === correctAnswer) {
    nextScores[side] += 1;

    return {
      isCorrect: true,
      nextPosition: side === 'left' ? position - step : position + step,
      nextScores,
    };
  }

  const backStep = step * wrongStepFactor;

  return {
    isCorrect: false,
    nextPosition: side === 'left' ? position + backStep : position - backStep,
    nextScores,
  };
}
