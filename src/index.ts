/**
 * Point d'entrée principal de la bibliothèque Soft2max.
 * Réexporte toutes les fonctionnalités publiques, types et guards de sécurité.
 */

// Réexportation des types et de la fonction maîtresse
export {
  soft2maxStreamingHeap,
  SoftmaxInput,
  SoftmaxResult
} from './soft2max.js';

// Réexportation du validateur (utile si un utilisateur souhaite valider ses flux manuellement)
export {
  validateSoft2maxArgs
} from './validation.js';
