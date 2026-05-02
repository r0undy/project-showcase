/** @type {import('jest').Config} */
const baseModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
};

/** @type {import('jest').Config} */
const config = {
  // Multi-project so server-side tests stay on node and component tests use jsdom.
  projects: [
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: [
        '<rootDir>/tests/properties/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/unit/utils/**/*.test.ts',
      ],
      setupFiles: ['<rootDir>/tests/jest.setup.ts'],
      moduleNameMapper: baseModuleNameMapper,
    },
    {
      displayName: 'components',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: ['<rootDir>/tests/unit/components/**/*.test.tsx'],
      setupFiles: ['<rootDir>/tests/jest.setup.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.dom.ts'],
      moduleNameMapper: baseModuleNameMapper,
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
      },
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

module.exports = config;
