const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
      isolatedModules: true,
    },
  },
};

export default config;


