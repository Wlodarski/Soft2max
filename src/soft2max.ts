import { validateSoft2maxArgs } from './validation.js';

/**
 * Représente un élément individuel fourni en entrée du calcul.
 */
export interface SoftmaxInput {
  label: string;
  score: number;
}

/**
 * Représente une entrée triée et stockée temporairement dans le tas binaire.
 */
interface HeapItem {
  index: number;
  label: string;
  score: number;
  weight: number;
}

/**
 * Représente un élément final formaté pour l'affichage dans l'interface utilisateur.
 */
export interface SoftmaxResult {
  index: number;
  label: string;
  percentage: number;
}

/**
 * Calcule une approximation de Softmax en UNE SEULE PASSE stricte avec un Tas Binaire (Min-Heap).
 * Conçu pour les flux de données (Streaming) massifs sans allocation mémoire superflue.
 * 
 * @param inputs - Tableau d'objets contenant un libellé et un score (entiers non-négatifs).
 * @param topK - Nombre d'éléments maximum à afficher individuellement (Default: 5).
 * @param maxInt - Somme totale cible pour le résultat, ex: 100 pour des pourcentages (Default: 100).
 * @param shiftBits - Sensibilité exponentielle / fenêtre de tolérance (Default: 5).
 * @param minPercentage - Seuil minimum (%) pour éviter l'exclusion individuelle dans "Autres" (Default: 2).
 * @returns Un tableau d'éléments formatés pour l'UI, incluant potentiellement la catégorie "Autres".
 */
export function soft2maxStreamingHeap(
  inputs: SoftmaxInput[],
  topK: number = 5,
  maxInt: number = 100,
  shiftBits: number = 5,
  minPercentage: number = 2
): SoftmaxResult[] {
  
  // 1. Validation de sécurité au runtime contre les données corrompues (NaN, négatifs, etc.)
  validateSoft2maxArgs(inputs, topK, maxInt, shiftBits, minPercentage);

  const n = inputs.length;
  if (n === 0) return [];

  const maxAllowedGap = shiftBits;
  const baseWeight = 1 << shiftBits;

  let maxVal = -Infinity;
  let heap: HeapItem[] = [];
  let leftoverWeight = 0;

  // --- Gestion interne du Tas Binaire (Min-Heap) ---
  function heapPush(item: HeapItem): void {
    heap.push(item);
    let idx = heap.length - 1;
    while (idx > 0) {
      let pIdx = (idx - 1) >> 1;
      if (heap[idx].score >= heap[pIdx].score) break;
      let tmp = heap[idx]; heap[idx] = heap[pIdx]; heap[pIdx] = tmp;
      idx = pIdx;
    }
  }

  function heapPopAndReplace(newItem: HeapItem): HeapItem {
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

  // --- 2. Boucle unique O(N) avec recalibrage binaire rétroactif ---
  for (let i = 0; i < n; i++) {
    const item = inputs[i];
    
    // Si un nouveau maximum absolu surgit, on réajuste instantanément le passé par décalage de bits
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
    if (diff > maxAllowedGap) continue; // Poids mathématiquement négligeable (proche de 0)

    const weight = baseWeight >> diff;
    const candidate: HeapItem = { index: i, label: item.label, score: item.score, weight: weight };

    // Maintien du Top-K au fil de l'eau via le Min-Heap
    if (heap.length < topK) {
      heapPush(candidate);
    } else if (item.score > heap[0].score) {
      const ejected = heapPopAndReplace(candidate);
      leftoverWeight += ejected.weight;
    } else {
      leftoverWeight += weight;
    }
  }

  // 3. Tri final du Top-K (K log K, hautement négligeable car K est très petit devant N)
  const topValues = heap.sort((a, b) => b.score - a.score);

  // 4. Calcul du poids cumulé total pour normalisation
  let totalWeight = leftoverWeight;
  for (let i = 0; i < topValues.length; i++) {
    totalWeight += topValues[i].weight;
  }
  if (totalWeight === 0) return [];

  // 5. Filtrage UI par seuil minimum de pourcentage
  const finalTop: HeapItem[] = [];
  for (let i = 0; i < topValues.length; i++) {
    const item = topValues[i];
    if ((item.weight / totalWeight) * maxInt < minPercentage) {
      leftoverWeight += item.weight;
    } else {
      finalTop.push(item);
    }
  }

  // 6. Distribution finale et lissage des entiers (Loi des plus grands restes simplifiée)
  const results: SoftmaxResult[] = [];
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

  // Ajustement final pour absorber les micro-écarts d'arrondis (ex: forcer 100%)
  const diffSum = maxInt - allocatedSum;
  if (diffSum !== 0 && results.length > 0) {
    results[0].percentage += diffSum;
  }

  return results;
}
