import { beforeAll, afterAll, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import '@testing-library/jest-dom';

// Test user credentials (matching the ones in migration)
const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'test123456';

// Generate a unique test mark for this test run
const TEST_MARK = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;

beforeAll(async () => {
  console.log('Setting up test environment...');

  // Sign in test user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  });

  if (signInError) {
    console.error('Failed to sign in test user:', signInError);
    throw signInError;
  }

  console.log('Test user signed in successfully');

  // Initialize test environment with jsonb payload
  // This creates necessary indexes and cleans any existing data with this test_mark
  // The JSONB parameter allows for future extension without changing function signatures
  const { error: initError } = await supabase.rpc('initialize_test_environment', {
    test_mark: TEST_MARK.toString()
  });

  if (initError) {
    console.error('Failed to initialize test environment:', initError);
    throw initError;
  }

  console.log('Test environment setup complete');
});

beforeEach(async () => {
  // Clean up previous test data for this test run with jsonb payload
  // Ensures isolation between test runs by removing data with matching test_mark
  // Uses standardized cleanup function that handles both members and check-ins
  const { error: cleanupError } = await supabase.rpc('cleanup_test_data', {
    test_mark: TEST_MARK.toString()
  });

  if (cleanupError) {
    console.error('Failed to cleanup test data:', cleanupError);
    throw cleanupError;
  }
});

afterAll(async () => {
  console.log('Cleaning up test environment...');

  // Final cleanup of all test data for this test run with jsonb payload
  const { error: cleanupError } = await supabase.rpc('cleanup_test_data', {
    test_mark: TEST_MARK.toString()
  });

  if (cleanupError) {
    console.error('Failed to cleanup test environment:', cleanupError);
    throw cleanupError;
  }

  // Sign out test user
  await supabase.auth.signOut();

  console.log('Test environment cleanup complete');
});

// Export TEST_MARK for use in test helpers
export { TEST_MARK };                                                                                                                                                                                                                                                                                                                                                                                    