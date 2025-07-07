export default {
    displayName: '@ptgt/fit-to-csv-converter',
    preset: '../jest.preset.cjs',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../coverage/fit-to-csv-converter',
};
