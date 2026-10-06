/**
 * Calcule une approximation de Softmax en UNE SEULE PASSE stricte avec un Tas Binaire (Min-Heap).
 * Conçu pour les flux de données (Streaming) massifs sans allocation mémoire superflue.
 * 
 * @param {Array<{label: string, score: number}>} inputs - Flux ou tableau d'objets.
 * @param {number} [topK=5] - Nombre d'éléments maximum à afficher individuellement.
 * @param {number} [maxInt=100] - Somme totale cible pour le résultat (ex: 100 pour %).
 * @param {number} [shiftBits=5] - Sensibilité exponentielle (fenêtre de tolérance).
 * @param {number} [minPercentage=2] - Seuil minimum (%) pour éviter l'exclusion individuelle dans "Autres".
 * @returns {Array<{index: number, label: string, percentage: number}>} Top-K + catégorie "Autres".
 */
export function soft2maxStreamingHeap(inputs, topK = 5, maxInt = 100, shiftBits = 5, minPercentage = 2) {
  const n = inputs.length;
  if (n === 0) return [];

  const maxAllowedGap = shiftBits;
  const baseWeight = 1 << shiftBits;

  let maxVal = -Infinity;
  let heap = [];
  let leftoverWeight = 0;

  // --- Gestion interne du Tas Binaire (Min-Heap) ---
  function heapPush(item) {
    heap.push(item);
    let idx = heap.length - 1;
    while (idx > 0) {
      let pIdx = (idx - 1) >> 1;
      if (heap[idx].score >= heap[pIdx].score) break;
      let tmp = heap[idx]; heap[idx] = heap[pIdx]; heap[pIdx] = tmp;
      idx = pIdx;
    }
  }

  function heapPopAndReplace(newItem) {
    const ejected = heap[0];
    heap[0] = newItem;
    let idx = 0;
    const len = heap.length;
    while (true) {
      let left = (idx << 1) + 1;
      let right = left + 1;
      let smallest = idx;

      if (left < len && heap[left].score < heap[smallest].score) smallest = left;
      if (right < len && heap[right].score < heap[smallest].score) smallest = right;
      if (smallest === idx) break;

      let tmp = heap[idx]; heap[idx] = heap[smallest]; heap[smallest] = tmp;
      idx = smallest;
    }
    return ejected;
  }

  // --- Boucle unique O(N) ---
  for (let i = 0; i < n; i++) {
    const item = inputs[i];
    
    // Recalcul rétroactif si un nouveau maximum absolu surgit
    if (item.score > maxVal) {
      if (maxVal !== -Infinity) {
        const delta = item.score - maxVal;
        
        if (delta > maxAllowedGap) {
          leftoverWeight = 0;
          for (let j = 0; j < heap.length; j++) {
            heap[j].weight = 0;
          }
        } else {
          leftoverWeight = leftoverWeight >> delta;
          for (let j = 0; j < heap.length; j++) {
            heap[j].weight = heap[j].weight >> delta;
          }
        }
      }
      maxVal = item.score;
    }

    const diff = maxVal - item.score;
    if (diff > maxAllowedGap) continue;

    const weight = baseWeight >> diff;
    const candidate = { index: i, label: item.label, score: item.score, weight: weight };

    if (heap.length < topK) {
      heapPush(candidate);
    } else if (item.score > heap[0].score) {
      const ejected = heapPopAndReplace(candidate);
      leftoverWeight += ejected.weight;
    } else {
      leftoverWeight += weight;
    }
  }

  // Tri final du Top-K (K log K, négligeable)
  const topValues = heap.sort((a, b) => b.score - a.score);

  let totalWeight = leftoverWeight;
  for (let i = 0; i < topValues.length; i++) {
    totalWeight += topValues[i].weight;
  }
  if (totalWeight === 0) return [];

  // Filtrage par seuil UI minimum
  const finalTop = [];
  for (let i = 0; i < topValues.length; i++) {
    const item = topValues[i];
    if ((item.weight / totalWeight) * maxInt < minPercentage) {
      leftoverWeight += item.weight;
    } else {
      finalTop.push(item);
    }
  }

  // Distribution et lissage des entiers
  const results = [];
  let allocatedSum = 0;

  for (let i = 0; i < finalTop.length; i++) {
    const pct = Math.round((finalTop[i].weight / totalWeight) * maxInt);
    allocatedSum += pct;
    results.push({ index: finalTop[i].index, label: finalTop[i].label, percentage: pct });
  }

  if (leftoverWeight > 0) {
    const pctAutres = Math.round((leftoverWeight / totalWeight) * maxInt);
    allocatedSum += pctAutres;
    results.push({ index: -1, label: "Autres", percentage: pctAutres });
  }

  let diffSum = maxInt - allocatedSum;
  if (diffSum !== 0 && results.length > 0) {
    results[0].percentage += diffSum;
  }

  return results;
}
