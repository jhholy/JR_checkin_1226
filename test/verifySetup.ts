import { supabase } from '../../lib/supabase';

async function verifyTestSetup() {
  console.log('Verifying test environment setup...');

  // Check if test user exists
  const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@test.com',
    password: 'test123456'
  });

  if (authError) {
    console.error('Test user verification failed:', authError);
    return false;
  }

  console.log('Test user exists and can authenticate');

  // Check if functions exist
  const { data: functions, error: functionError } = await supabase
    .rpc('initialize_test_environment', { test_mark: 'verify_setup' });

  if (functionError) {
    console.error('Function verification failed:', functionError);
    return false;
  }

  console.log('Test functions exist and are accessible');

  // Clean up verification data
  const { error: cleanupError } = await supabase
    .rpc('cleanup_test_data', { test_mark: 'verify_setup' });

  if (cleanupError) {
    console.error('Cleanup verification failed:', cleanupError);
    return false;
  }

  console.log('Test environment setup verified successfully');
  return true;
}

// Run verification
verifyTestSetup().then((success) => {
  if (!success) {
    console.error('Test environment verification failed');
    process.exit(1);
  }
  console.log('Test environment verification completed successfully');
  process.exit(0);
});
