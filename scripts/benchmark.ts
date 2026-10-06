import { soft2maxStreamingHeap } from '../src/soft2max.js';
import type { SoftmaxInput } from '../src/soft2max.js';

/**
 * Implémentation traditionnelle de référence : Softmax standard (Flottants + Tri Global)
 */
function traditionalSoftmax(
  inputs: SoftmaxInput[],
  topK: number = 5,
  maxInt: number = 100,
  minPercentage: number = 2
): Array<{ index: number; label: string; percentage: number }> {
  const n = inputs.length;
  if (n === 0) return [];

  let maxVal = -Infinity;
  for (let i = 0; i < n; i++) {
    if (inputs[i].score > maxVal) maxVal = inputs[i].score;
  }

  let sumExp = 0;
  const expValues = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const exp = Math.exp(inputs[i].score - maxVal);
    expValues[i] = exp;
    sumExp += exp;
  }

  const items: Array<{ index: number; label: string; pct: number }> = [];
  for (let i = 0; i < n; i++) {
    items.push({
      index: i,
      label: inputs[i].label,
      pct: (expValues[i] / sumExp) * maxInt
    });
  }
  items.sort((a, b) => b.pct - a.pct);

  const results: Array<{ index: number; label: string; percentage: number }> = [];
  let leftoverWeight = 0;
  let allocatedSum = 0;

  for (let i = 0; i < n; i++) {
    if (i < topK && items[i].pct >= minPercentage) {
      const pct = Math.round(items[i].pct);
      allocatedSum += pct;
      results.push({ index: items[i].index, label: items[i].label, percentage: pct });
    } else {
      leftoverWeight += items[i].pct;
    }
  }

  if (leftoverWeight > 0) {
    const pctAutres = Math.round(leftoverWeight);
    allocatedSum += pctAutres;
    results.push({ index: -1, label: "Autres", percentage: pctAutres });
  }

  const diffSum = maxInt - allocatedSum;
  if (diffSum !== 0 && results.length > 0) {
    results[0].percentage += diffSum;
  }

  return results;
}

function generateLargeDataset(size: number): SoftmaxInput[] {
  const dataset: SoftmaxInput[] = [];
  for (let i = 0; i < size; i++) {
    let score = 0;
    if (i === 42) {
      score = 120;
    } else if (i < 5) {
      score = 115 - i;
    } else {
      score = Math.floor(Math.random() * 85);
    }
    dataset.push({ label: `Item #${i}`, score: score });
  }
  return dataset;
}

const DATASET_SIZE = 500_000;
const TOP_K = 5;
const ITERATIONS = 10;

console.log(`\x1b[36m--- Lancement du Benchmark de Performance ---`);
console.log(`Taille du jeu de données : ${DATASET_SIZE.toLocaleString()} éléments`);
console.log(`Top-K demandé            : ${TOP_K}\x1b[0m\n`);

const dataset = generateLargeDataset(DATASET_SIZE);

const startTrad = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  traditionalSoftmax(dataset, TOP_K, 100, 2);
}
const endTrad = performance.now();
const avgTrad = (endTrad - startTrad) / ITERATIONS;

const startOpti = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  soft2maxStreamingHeap(dataset, TOP_K, 100, 5, 2);
}
const endOpti = performance.now();
const avgOpti = (endOpti - startOpti) / ITERATIONS;

console.log(`Résultats moyens calculés sur ${ITERATIONS} itérations :`);
console.log(`========================================================`);
console.log(`🔴 Softmax Traditionnel (Flottants + Tri) : \x1b[31m${avgTrad.toFixed(2)} ms\x1b[0m`);
console.log(`🟢 Votre Softmax (Streaming + Min-Heap)  : \x1b[32m${avgOpti.toFixed(2)} ms\x1b[0m`);
console.log(`========================================================`);

const speedup = avgTrad / avgOpti;
console.log(`\n\x1b[1m🚀 Votre algorithme est environ \x1b[32m${speedup.toFixed(1)}x plus rapide\x1b[0m\x1b[1m que la méthode classique !\x1b[0m\n`);
