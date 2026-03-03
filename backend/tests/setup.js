/**
 * Jest Test Setup
 *
 * Runs before all test suites. Sets environment variables
 * needed by tests and silences console output during tests.
 */

// Set required env vars for tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.OTP_EXPIRY_MINUTES = '10';
process.env.PII_ENCRYPTION_KEY = 'cILzjBgR-koTKatjara7GCYEQPnkgbDJMCHD2zkPsok=';

// Silence console during tests (optional — comment out for debugging)
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});
