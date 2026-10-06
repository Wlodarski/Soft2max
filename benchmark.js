import { soft2maxStreamingHeap } from './soft2max.js';

function traditionalSoftmax(inputs, topK = 5, maxInt = 100, minPercentage = 2) {
  const n = inputs.length;
  if (n === 0) return [];

  let maxVal = -Infinity;
  for (let i = 0; i < n; i++) {
    if (inputs[i].score > maxVal) maxVal = inputs[i].score;
  }

  let sumExp = 0;
  const expValues = new Array(n);
  for (let i = 0; i < n; i++) {
    const exp = Math.exp(inputs[i].score - maxVal);
    expValues[i] = exp;
    sumExp += exp;
  }

  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({ index: i, label: inputs[i].label, pct: (expValues[i] / sumExp) * maxInt });
  }
  items.sort((a, b) => b.pct - a.pct);

  const results = [];
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

  let diffSum = maxInt - allocatedSum;
  if (diffSum !== 0 && results.length > 0) {
    results[0].percentage += diffSum;
  }

  return results;
}

function generateLargeDataset(size) {
  const dataset = [];
  for (let i = 0; i < size; i++) {
    let score = i === 42 ? 120 : (i < 5 ? 115 - i : Math.floor(Math.random() * 85));
    dataset.push({ label: `Item #${i}`, score: score });
  }
  return dataset;
}

const DATASET_SIZE = 500_000;
const TOP_K = 5;
const ITERATIONS = 10;

console.log(`\x1b[36m--- Lancement du Benchmark ---`);
console.log(`Taille : ${DATASET_SIZE.toLocaleString()} éléments | Top-K : ${TOP_K}\x1b[0m\n`);

const dataset = generateLargeDataset(DATASET_SIZE);

let startTrad = performance.now();
for (let i = 0; i < ITERATIONS; i++) traditionalSoftmax(dataset, TOP_K, 100, 2);
let avgTrad = (performance.now() - startTrad) / ITERATIONS;

let startOpti = performance.now();
for (let i = 0; i < ITERATIONS; i++) soft2maxStreamingHeap(dataset, TOP_K, 100, 5, 2);
let avgOpti = (performance.now() - startOpti) / ITERATIONS;

console.log(`Résultats moyens (${ITERATIONS} itérations) :`);
console.log(`=============================================`);
console.log(`Softmax Traditionnel : \x1b[31m${avgTrad.toFixed(2)} ms\x1b[0m`);
console.log(`... Tri complet O(N log N) + Allocs Mémoire`);
console.log(`---------------------------------------------`);
console.log(` Soft2max        : \x1b[32m${avgOpti.toFixed(2)} ms\x1b[0m`);
console.log(`... Streaming O(N log K) + Bit-Shifting`);
console.log(`=============================================`);
console.log(`\n Gain de vitesse : \x1b[32m${(avgTrad / avgOpti).toFixed(1)}x plus rapide\x1b[0m\n`);
