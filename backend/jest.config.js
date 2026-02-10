module.exports = {
    testEnvironment: 'node',
    // You might need to adjust this depending on how your tests are structured
    verbose: true,
    // Ignore node_modules
    testPathIgnorePatterns: ['/node_modules/'],
    // Coverage
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/'],
};
