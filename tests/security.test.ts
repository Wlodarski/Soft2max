import { soft2maxStreamingHeap } from '../src/soft2max.js';

describe('Tests de Sécurité - Validation Runtime', () => {
  
  test('Doit lever une erreur si les inputs ne sont pas un tableau', () => {
    // @ts-expect-error - Test volontaire d'une donnée invalide au runtime
    expect(() => soft2maxStreamingHeap("not-an-array")).toThrow(TypeError);
  });

  test('Doit lever une erreur si la structure d\'un objet est invalide', () => {
    const badDataset = [
      { label: 'Option Valide', score: 10 },
      // @ts-expect-error - Objet mal formé
      { name: 'Option Invalide', score: 20 }
    ];
    expect(() => soft2maxStreamingHeap(badDataset)).toThrow(TypeError);
  });

  test('Doit lever une erreur si le score est un nombre flottant', () => {
    const badDataset = [{ label: 'Option A', score: 10.5 }];
    expect(() => soft2maxStreamingHeap(badDataset)).toThrow(TypeError);
  });

  test('Doit lever une erreur si le score est négatif', () => {
    const badDataset = [{ label: 'Option B', score: -5 }];
    expect(() => soft2maxStreamingHeap(badDataset)).toThrow(RangeError);
  });

  test('Doit lever une erreur si le score est NaN', () => {
    const badDataset = [{ label: 'Option C', score: NaN }];
    expect(() => soft2maxStreamingHeap(badDataset)).toThrow(TypeError);
  });

  test('Doit lever une erreur si topK est inférieur à 1', () => {
    const dataset = [{ label: 'Option D', score: 10 }];
    expect(() => soft2maxStreamingHeap(dataset, 0)).toThrow(RangeError);
  });

  test('Doit lever une erreur si shiftBits dépasse les limites matérielles du CPU (> 30)', () => {
    const dataset = [{ label: 'Option E', score: 10 }];
    // En JS, les décalages binaires s'effectuent sur des entiers signés de 32 bits (modulo 32).
    // Une valeur > 30 provoquerait un comportement binaire imprévisible.
    expect(() => soft2maxStreamingHeap(dataset, 5, 100, 31)).toThrow(RangeError);
  });

  test('Doit lever une erreur si minPercentage est hors limites', () => {
    const dataset = [{ label: 'Option F', score: 10 }];
    expect(() => soft2maxStreamingHeap(dataset, 5, 100, 5, -1)).toThrow(RangeError);
    expect(() => soft2maxStreamingHeap(dataset, 5, 100, 5, 101)).toThrow(RangeError);
  });
});
