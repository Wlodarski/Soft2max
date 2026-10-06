/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Permet à Jest de résoudre correctement les imports locaux terminant par '.js'
    '^(\\.\\.?\\/.+)\\.js$': '$1',
  },
  transform: {
    // Transpile les fichiers TypeScript à la volée en conservant le format ESM
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
