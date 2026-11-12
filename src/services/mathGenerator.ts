import { MathChallenge, MathDifficulty, PowerUpType } from '../types/game';

const POWERUP_REWARDS: PowerUpType[] = [
  'COIN_MAGNET',
  'SUPER_JUMP',
  'STAR_SHIELD',
  'DOUBLE_COINS',
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateMathChallenge(
  platformIndex: number,
  userDifficulty: MathDifficulty = 'adaptativo'
): MathChallenge {
  // Determine effective level (1 to 5+) based on platform and user setting
  let tier = Math.max(1, Math.floor(platformIndex / 10));

  if (userDifficulty === 'facil') {
    tier = 1;
  } else if (userDifficulty === 'medio') {
    tier = Math.min(tier, 2);
  } else if (userDifficulty === 'dificil') {
    tier = Math.max(tier, 3);
  }

  let expression = '';
  let question = '';
  let correctAnswer = 0;
  let operation: '+' | '-' | '×' | '÷' | 'mixed' = '+';
  let explanation = '';

  if (tier === 1) {
    // Tier 1 (Platforms 1-10): Basic Addition and Subtraction (1 to 20)
    const isAdd = Math.random() > 0.4;
    if (isAdd) {
      const a = getRandomInt(3, 14);
      const b = getRandomInt(2, 12);
      correctAnswer = a + b;
      expression = `${a} + ${b}`;
      question = `Quanto é ${a} + ${b}?`;
      operation = '+';
      explanation = `Somando ${a} com ${b}, obtemos exatamente ${correctAnswer}!`;
    } else {
      const a = getRandomInt(8, 20);
      const b = getRandomInt(2, a - 1);
      correctAnswer = a - b;
      expression = `${a} - ${b}`;
      question = `Quanto é ${a} - ${b}?`;
      operation = '-';
      explanation = `Subtraindo ${b} de ${a}, sobram ${correctAnswer}!`;
    }
  } else if (tier === 2) {
    // Tier 2 (Platforms 11-20): Double-digits & basic multiplication (tables 2, 3, 4, 5, 10)
    const typeChoice = getRandomInt(1, 3);
    if (typeChoice === 1) {
      // 2-digit addition
      const a = getRandomInt(15, 45);
      const b = getRandomInt(12, 38);
      correctAnswer = a + b;
      expression = `${a} + ${b}`;
      question = `Resolva a soma: ${a} + ${b}`;
      operation = '+';
      explanation = `${a} + ${b} = ${correctAnswer}. Excelente raciocínio!`;
    } else if (typeChoice === 2) {
      // 2-digit subtraction
      const a = getRandomInt(30, 80);
      const b = getRandomInt(11, a - 5);
      correctAnswer = a - b;
      expression = `${a} - ${b}`;
      question = `Resolva a subtração: ${a} - ${b}`;
      operation = '-';
      explanation = `${a} menos ${b} é igual a ${correctAnswer}!`;
    } else {
      // Simple tables (2, 3, 4, 5, 10)
      const tables = [2, 3, 4, 5, 10];
      const a = tables[Math.floor(Math.random() * tables.length)];
      const b = getRandomInt(3, 9);
      correctAnswer = a * b;
      expression = `${a} × ${b}`;
      question = `Quanto é ${a} vezes ${b}?`;
      operation = '×';
      explanation = `${a} grupos de ${b} totalizam ${correctAnswer}!`;
    }
  } else if (tier === 3) {
    // Tier 3 (Platforms 21-30): Full multiplication tables (6, 7, 8, 9) and exact division
    const isMult = Math.random() > 0.45;
    if (isMult) {
      const a = getRandomInt(6, 9);
      const b = getRandomInt(4, 9);
      correctAnswer = a * b;
      expression = `${a} × ${b}`;
      question = `Multiplicação rápida: ${a} × ${b}`;
      operation = '×';
      explanation = `Na tabuada do ${a}: ${a} × ${b} = ${correctAnswer}!`;
    } else {
      // Exact division
      const divisor = getRandomInt(3, 9);
      const quotient = getRandomInt(3, 10);
      const dividend = divisor * quotient;
      correctAnswer = quotient;
      expression = `${dividend} ÷ ${divisor}`;
      question = `Divida: ${dividend} ÷ ${divisor}`;
      operation = '÷';
      explanation = `${dividend} dividido em ${divisor} partes iguais dá ${correctAnswer}!`;
    }
  } else if (tier === 4) {
    // Tier 4 (Platforms 31-40): Combined operations with order of operations
    const pattern = getRandomInt(1, 3);
    if (pattern === 1) {
      // (a * b) + c
      const a = getRandomInt(3, 8);
      const b = getRandomInt(3, 6);
      const c = getRandomInt(5, 20);
      correctAnswer = a * b + c;
      expression = `(${a} × ${b}) + ${c}`;
      question = `Calcule: (${a} × ${b}) + ${c}`;
      operation = 'mixed';
      explanation = `Primeiro multiplica (${a} × ${b} = ${a * b}), depois soma ${c} = ${correctAnswer}!`;
    } else if (pattern === 2) {
      // total - (a * b)
      const a = getRandomInt(2, 6);
      const b = getRandomInt(3, 7);
      const product = a * b;
      const base = product + getRandomInt(10, 35);
      correctAnswer = base - product;
      expression = `${base} - (${a} × ${b})`;
      question = `Calcule: ${base} - (${a} × ${b})`;
      operation = 'mixed';
      explanation = `Primeiro ${a} × ${b} = ${product}, depois ${base} - ${product} = ${correctAnswer}!`;
    } else {
      // (a + b) × c
      const a = getRandomInt(4, 12);
      const b = getRandomInt(3, 8);
      const c = getRandomInt(2, 5);
      correctAnswer = (a + b) * c;
      expression = `(${a} + ${b}) × ${c}`;
      question = `Calcule: (${a} + ${b}) × ${c}`;
      operation = 'mixed';
      explanation = `Entre parênteses primeiro (${a} + ${b} = ${a + b}), depois multiplica por ${c} = ${correctAnswer}!`;
    }
  } else {
    // Tier 5+ (Platforms 41+): Master challenges (speed mental math & powers/halves)
    const style = getRandomInt(1, 3);
    if (style === 1) {
      // Half or Double
      const isDouble = Math.random() > 0.5;
      if (isDouble) {
        const num = getRandomInt(15, 65);
        correctAnswer = num * 2;
        expression = `2 × ${num}`;
        question = `Qual é o dobro de ${num}?`;
        operation = '×';
        explanation = `O dobro de ${num} é ${num} + ${num} = ${correctAnswer}!`;
      } else {
        const num = getRandomInt(12, 48) * 2;
        correctAnswer = num / 2;
        expression = `${num} ÷ 2`;
        question = `Qual é a metade de ${num}?`;
        operation = '÷';
        explanation = `A metade de ${num} é ${correctAnswer}!`;
      }
    } else {
      // Three-part chain: a * b - c or a * b + c
      const a = getRandomInt(7, 12);
      const b = getRandomInt(4, 8);
      const c = getRandomInt(10, 25);
      correctAnswer = a * b - c;
      expression = `${a} × ${b} - ${c}`;
      question = `Desafio Mestre: ${a} × ${b} - ${c}`;
      operation = 'mixed';
      explanation = `${a} × ${b} = ${a * b}, e subtraindo ${c} = ${correctAnswer}!`;
    }
  }

  // Generate 3 plausible distractors
  const distractors = new Set<number>();
  const deltas = [-2, -1, 1, 2, -3, 3, 5, -5, 10, -10];

  // Try standard near-misses
  for (const delta of shuffleArray(deltas)) {
    const candidate = correctAnswer + delta;
    if (candidate > 0 && candidate !== correctAnswer) {
      distractors.add(candidate);
      if (distractors.size >= 3) break;
    }
  }

  // If still need more, generate random close numbers
  while (distractors.size < 3) {
    const candidate = Math.max(1, correctAnswer + getRandomInt(-15, 15));
    if (candidate !== correctAnswer) {
      distractors.add(candidate);
    }
  }

  const options = shuffleArray([correctAnswer, ...Array.from(distractors).slice(0, 3)]);

  // Select a reward powerup
  const rewardPowerUp = POWERUP_REWARDS[Math.floor(Math.random() * POWERUP_REWARDS.length)];

  return {
    id: `math-p${platformIndex}-${Date.now()}`,
    platformIndex,
    question,
    expression,
    options,
    correctAnswer,
    difficulty: userDifficulty,
    explanation,
    operation,
    rewardPowerUp,
    rewardCoins: 25,
    timeLimitSeconds: 10,
    isBossChallenge: platformIndex >= 300,
  };
}
