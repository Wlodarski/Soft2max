/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/preset/default-esm', // Active la gestion native du format ESM avec ts-jest
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Permet à Jest de comprendre les imports se terminant par '.js' dans les fichiers de code source compilés
    '^(\\.\\.?\\/.+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Force ts-jest à compiler en ES Modules
      },
    ],
  },
};
