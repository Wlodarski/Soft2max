import { soft2maxStreamingHeap } from '../dist/soft2max.js';

describe('Tests Unitaires - soft2maxStreamingHeap', () => {
  // Utilitaire pour vérifier si la somme des pourcentages est correcte
  const checkSum = (results: SoftmaxResult[], expectedTotal: number = 100): void => {
    if (results.length === 0) return;
    const total = results.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(total).toBe(expectedTotal);
  };

  test('Cas Nominal : Répartition classique équilibrée', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Option A', score: 50 },
      { label: 'Option B', score: 48 },
      { label: 'Option C', score: 45 },
      { label: 'Option D', score: 20 }
    ];
    const res = soft2maxStreamingHeap(dataset, 3, 100, 5, 2);
    expect(res.length).toBeLessThanOrEqual(4); // Top 3 + "Autres"
    checkSum(res, 100);
    expect(res[0].label).toBe('Option A');
  });

  test('Cas Extrême : Tableau complètement vide', () => {
    const res = soft2maxStreamingHeap([], 5, 100);
    expect(res).toEqual([]);
  });

  test('Cas Extrême : Un élément géant écrase tout', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Minuscule 1', score: 10 },
      { label: 'Géant', score: 1000 },
      { label: 'Minuscule 2', score: 5 }
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 5, 0);
    checkSum(res, 100);
    const geant = res.find(item => item.label === 'Géant');
    expect(geant).toBeDefined();
    expect(geant!.percentage).toBe(100);
  });

  test('Cas Extrême : Découverte du Maximum à la fin', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Leader Temp 1', score: 20 },
      { label: 'Leader Temp 2', score: 22 },
      { label: 'Vrai gagnant tardif', score: 50 }
    ];
    const res = soft2maxStreamingHeap(dataset, 2, 100, 4, 1);
    checkSum(res, 100);
    expect(res[0].label).toBe('Vrai gagnant tardif');
  });

  test('Cas Extrême : Égalité parfaite partout', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'A', score: 40 }, 
      { label: 'B', score: 40 }, 
      { label: 'C', score: 40 }
    ];
    const res = soft2maxStreamingHeap(dataset, 2, 100, 5, 0);
    checkSum(res, 100);
    expect(res.length).toBe(3); // Top 2 + Autres
  });

  test('Cas Métier : Filtrage par le seuil minimum', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Leader 1', score: 100 },
      { label: 'Leader 2', score: 98 },
      { label: 'Faible', score: 85 }
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 5, 25);
    checkSum(res, 100);
    expect(res.some(item => item.label === 'Faible')).toBe(false);
  });

  test('A. Test de Stabilité du Max (Max qui oscille)', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Init', score: 10 },
      { label: 'Wave 1', score: 15 },
      { label: 'Bruit 1', score: 12 },
      { label: 'Wave 2', score: 22 },
      { label: 'Wave 3 - Vrai Max', score: 30 },
      { label: 'Bruit 3', score: 28 }
    ];
    const res = soft2maxStreamingHeap(dataset, 3, 100, 4, 0);
    checkSum(res, 100);
    expect(res[0].label).toBe('Wave 3 - Vrai Max');
    expect(res.find(item => item.label === 'Wave 2')).toBeUndefined(); // Tombé hors de la fenêtre de tolérance exponentielle
  });

  test('B. Test de Limite de shiftBits (Frontière)', () => {
    const dataset: SoftmaxInput[] = [
      { label: 'Le Gagnant', score: 20 },
      { label: 'Juste à la Frontière', score: 17 }, // Écart = 3 (Accepté si shiftBits=3)
      { label: 'Juste au-delà', score: 16 }         // Écart = 4 (Rejeté d'office)
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 3, 0);
    checkSum(res, 100);
    expect(res.find(item => item.label === 'Juste à la Frontière')).toBeDefined();
    expect(res.find(item => item.label === 'Juste au-delà')).toBeUndefined();
  });
});
