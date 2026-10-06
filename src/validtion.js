import { SoftmaxInput } from './soft2max.js';

/**
 * Valide rigoureusement les arguments d'entrée de Soft2max pour éviter les comportements indéterminés du CPU.
 * @throws {TypeError} Si un paramètre possède un type invalide ou si un objet est mal formé.
 * @throws {RangeError} Si une valeur numérique est en dehors des limites logiques ou matérielles admissibles.
 */
export function validateSoft2maxArgs(
  inputs: SoftmaxInput[],
  topK: number,
  maxInt: number,
  shiftBits: number,
  minPercentage: number
): void {
  // 1. Validation des paramètres de configuration fondamentaux
  if (typeof topK !== 'number' || Number.isNaN(topK) || !Number.isInteger(topK) || topK < 1) {
    throw new RangeError("Soft2max Configuration: 'topK' must be a strictly positive integer.");
  }
  if (typeof maxInt !== 'number' || Number.isNaN(maxInt) || !Number.isInteger(maxInt) || maxInt < 1) {
    throw new RangeError("Soft2max Configuration: 'maxInt' must be a positive integer (e.g., 100).");
  }
  if (typeof shiftBits !== 'number' || Number.isNaN(shiftBits) || !Number.isInteger(shiftBits) || shiftBits < 0 || shiftBits > 30) {
    throw new RangeError("Soft2max Configuration: 'shiftBits' must be an integer between 0 and 30 to prevent bitwise overflow.");
  }
  if (typeof minPercentage !== 'number' || Number.isNaN(minPercentage) || minPercentage < 0 || minPercentage > maxInt) {
    throw new RangeError(`Soft2max Configuration: 'minPercentage' must be a number between 0 and ${maxInt}.`);
  }

  // 2. Validation de l'existence du tableau d'entrée
  if (!Array.isArray(inputs)) {
    throw new TypeError("Soft2max Input: 'inputs' must be a valid array.");
  }

  // 3. Validation approfondie de chaque élément (Runtime Object Sanity Check)
  for (let i = 0; i < inputs.length; i++) {
    const item = inputs[i];
    
    if (!item || typeof item !== 'object') {
      throw new TypeError(`Soft2max Input: Element at index ${i} is not a valid object.`);
    }
    
    if (typeof item.label !== 'string') {
      throw new TypeError(`Soft2max Input: Element at index ${i} is missing a text 'label'.`);
    }

    const score = item.score;
    if (typeof score !== 'number' || Number.isNaN(score)) {
      throw new TypeError(`Soft2max Input: Element at index ${i} ('${item.label}') has an invalid or NaN 'score'.`);
    }

    if (!Number.isInteger(score)) {
      throw new TypeError(`Soft2max Input: Element at index ${i} ('${item.label}') has a floating-point score. Soft2max requires integers.`);
    }

    if (score < 0) {
      throw new RangeError(`Soft2max Input: Element at index ${i} ('${item.label}') has a negative score (${score}). Scores must be non-negative.`);
    }
  }
}
