/**
 * Point d'entrée principal de la bibliothèque Soft2max.
 * Réexporte toutes les fonctionnalités publiques, types et guards de sécurité.
 */

// 1. Réexportation de la logique de production (Fonctions réelles au runtime)
export {
  soft2maxStreamingHeap
} from './soft2max.js';

// 2. Réexportation explicite des interfaces (Supprimées à la compilation par isolatedModules)
export type {
  SoftmaxInput,
  SoftmaxResult
} from './soft2max.js';

// 3. Réexportation du validateur au runtime
export {
  validateSoft2maxArgs
} from './validation.js';
