module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|@supabase/.*)/)',
  ],
};
