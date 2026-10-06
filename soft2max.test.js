import { soft2maxStreamingHeap } from './soft2max.js';

describe('Tests Unitaires - soft2maxStreamingHeap', () => {
  const checkSum = (results, expectedTotal = 100) => {
    if (results.length === 0) return;
    const total = results.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(total).toBe(expectedTotal);
  };

  test('Cas Nominal : Répartition classique équilibrée', () => {
    const dataset = [
      { label: 'Option A', score: 50 },
      { label: 'Option B', score: 48 },
      { label: 'Option C', score: 45 },
      { label: 'Option D', score: 20 }
    ];
    const res = soft2maxStreamingHeap(dataset, 3, 100, 5, 2);
    expect(res.length).toBeLessThanOrEqual(4);
    checkSum(res, 100);
    expect(res[0].label).toBe('Option A');
  });

  test('Cas Extrême : Tableau complètement vide', () => {
    const res = soft2maxStreamingHeap([], 5, 100);
    expect(res).toEqual([]);
  });

  test('Cas Extrême : Un élément géant écrase tout', () => {
    const dataset = [
      { label: 'Minuscule 1', score: 10 },
      { label: 'Géant', score: 1000 },
      { label: 'Minuscule 2', score: 5 }
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 5, 0);
    checkSum(res, 100);
    const geant = res.find(item => item.label === 'Géant');
    expect(geant.percentage).toBe(100);
  });

  test('Cas Extrême : Découverte du Maximum à la fin', () => {
    const dataset = [
      { label: 'Leader Temp 1', score: 20 },
      { label: 'Leader Temp 2', score: 22 },
      { label: 'Vrai gagnant tardif', score: 50 }
    ];
    const res = soft2maxStreamingHeap(dataset, 2, 100, 4, 1);
    checkSum(res, 100);
    expect(res[0].label).toBe('Vrai gagnant tardif');
  });

  test('Cas Extrême : Égalité parfaite partout', () => {
    const dataset = [{ label: 'A', score: 40 }, { label: 'B', score: 40 }, { label: 'C', score: 40 }];
    const res = soft2maxStreamingHeap(dataset, 2, 100, 5, 0);
    checkSum(res, 100);
    expect(res.length).toBe(3); // Top 2 + Autres
  });

  test('Cas Métier : Filtrage par le seuil minimum', () => {
    const dataset = [
      { label: 'Leader 1', score: 100 },
      { label: 'Leader 2', score: 98 },
      { label: 'Faible', score: 85 }
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 5, 25);
    checkSum(res, 100);
    expect(res.some(item => item.label === 'Faible')).toBe(false);
  });

  test('A. Test de Stabilité du Max (Max qui oscille)', () => {
    const dataset = [
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
    expect(res.find(item => item.label === 'Wave 2')).toBeUndefined(); // Tombé hors portée
  });

  test('B. Test de Limite de shiftBits (Frontière)', () => {
    const dataset = [
      { label: 'Le Gagnant', score: 20 },
      { label: 'Juste à la Frontière', score: 17 }, // Écart = 3 (Accepté si shiftBits=3)
      { label: 'Juste au-delà', score: 16 }         // Écart = 4 (Rejeté)
    ];
    const res = soft2maxStreamingHeap(dataset, 5, 100, 3, 0);
    checkSum(res, 100);
    expect(res.find(item => item.label === 'Juste à la Frontière')).toBeDefined();
    expect(res.find(item => item.label === 'Juste au-delà')).toBeUndefined();
  });
});
