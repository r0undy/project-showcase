/**
 * Property-Based Tests for Onboarding Progress
 * Feature: aws-community-showcase
 * 
 * Tests universal properties of onboarding progress tracking,
 * including completion timestamp automation.
 */

import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for testing');
}

const supabaseTest = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Helper function to create a test user
 */
async function createTestUser(username: string): Promise<string> {
  const { data, error } = await supabaseTest
    .from('users')
    .insert({
      username,
      awscc_id: `TEST-${Date.now()}`,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Helper function to clean up test data
 */
async function cleanupTestUser(userId: string): Promise<void> {
  await supabaseTest.from('users').delete().eq('id', userId);
}

/**
 * Helper function to validate ISO 8601 timestamp format
 */
function isValidISO8601(timestamp: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?([+-]\d{2}:\d{2}|Z)$/;
  return iso8601Regex.test(timestamp) && !isNaN(Date.parse(timestamp));
}

/**
 * Helper function to check if timestamp is within tolerance of current time
 */
function isWithinTolerance(timestamp: string, toleranceMs: number = 5000): boolean {
  const timestampDate = new Date(timestamp);
  const now = new Date();
  const diff = Math.abs(now.getTime() - timestampDate.getTime());
  return diff <= toleranceMs;
}

describe('Onboarding Progress Property Tests', () => {
  /**
   * Property 14: Completion timestamp automation
   * **Validates: Requirements 14.5**
   * 
   * For any onboarding progress record where is_completed changes from false to true,
   * the completed_at field SHALL be automatically set to a valid ISO 8601 timestamp
   * representing the current time.
   * 
   * Tag: Feature: aws-community-showcase, Property 14: Completion timestamp automation
   */
  describe('Property 14: Completion timestamp automation', () => {
    it('should automatically set completed_at to valid ISO 8601 timestamp when is_completed changes from false to true', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary step numbers (1-7)
          fc.integer({ min: 1, max: 7 }),
          async (stepNumber) => {
            // Create a test user
            const username = `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const userId = await createTestUser(username);

            try {
              // Create an onboarding progress record with is_completed = false
              const { data: initialRecord, error: insertError } = await supabaseTest
                .from('onboarding_progress')
                .insert({
                  user_id: userId,
                  step_number: stepNumber,
                  is_completed: false,
                })
                .select()
                .single();

              expect(insertError).toBeNull();
              expect(initialRecord).toBeDefined();
              expect(initialRecord!.is_completed).toBe(false);
              expect(initialRecord!.completed_at).toBeNull();

              // Capture time before update
              const beforeUpdate = new Date();

              // Update is_completed from false to true
              const { data: updatedRecord, error: updateError } = await supabaseTest
                .from('onboarding_progress')
                .update({ is_completed: true })
                .eq('id', initialRecord!.id)
                .select()
                .single();

              // Capture time after update
              const afterUpdate = new Date();

              expect(updateError).toBeNull();
              expect(updatedRecord).toBeDefined();

              // Property assertions
              // 1. is_completed should be true
              expect(updatedRecord!.is_completed).toBe(true);

              // 2. completed_at should be set (not null)
              expect(updatedRecord!.completed_at).not.toBeNull();

              // 3. completed_at should be a valid ISO 8601 timestamp
              expect(isValidISO8601(updatedRecord!.completed_at!)).toBe(true);

              // 4. completed_at should be a recent timestamp.
              // Allow generous tolerance to absorb clock skew between this machine
              // and the Supabase Postgres server (the trigger uses server-side NOW()).
              const CLOCK_SKEW_TOLERANCE_MS = 60_000;
              const completedAtDate = new Date(updatedRecord!.completed_at!);
              expect(completedAtDate.getTime()).toBeGreaterThanOrEqual(
                beforeUpdate.getTime() - CLOCK_SKEW_TOLERANCE_MS
              );
              expect(completedAtDate.getTime()).toBeLessThanOrEqual(
                afterUpdate.getTime() + CLOCK_SKEW_TOLERANCE_MS
              );

              // 5. completed_at should be within reasonable tolerance of NOW()
              expect(isWithinTolerance(updatedRecord!.completed_at!, CLOCK_SKEW_TOLERANCE_MS)).toBe(true);

            } finally {
              // Cleanup
              await cleanupTestUser(userId);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 120000); // 2 minute timeout for property test with 100 runs

    it('should NOT modify completed_at when is_completed remains true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 7 }),
          async (stepNumber) => {
            const username = `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const userId = await createTestUser(username);

            try {
              // Create record with is_completed = true
              const { data: initialRecord, error: insertError } = await supabaseTest
                .from('onboarding_progress')
                .insert({
                  user_id: userId,
                  step_number: stepNumber,
                  is_completed: true,
                })
                .select()
                .single();

              expect(insertError).toBeNull();
              expect(initialRecord).toBeDefined();

              const originalCompletedAt = initialRecord!.completed_at;

              // Wait a moment to ensure timestamps would differ if changed
              await new Promise(resolve => setTimeout(resolve, 100));

              // Update is_completed to true again (no change from false to true)
              const { data: updatedRecord, error: updateError } = await supabaseTest
                .from('onboarding_progress')
                .update({ is_completed: true })
                .eq('id', initialRecord!.id)
                .select()
                .single();

              expect(updateError).toBeNull();
              expect(updatedRecord).toBeDefined();

              // Property: completed_at should remain unchanged
              expect(updatedRecord!.completed_at).toBe(originalCompletedAt);

            } finally {
              await cleanupTestUser(userId);
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);

    it('should NOT set completed_at when is_completed remains false', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 7 }),
          async (stepNumber) => {
            const username = `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const userId = await createTestUser(username);

            try {
              // Create record with is_completed = false
              const { data: initialRecord, error: insertError } = await supabaseTest
                .from('onboarding_progress')
                .insert({
                  user_id: userId,
                  step_number: stepNumber,
                  is_completed: false,
                })
                .select()
                .single();

              expect(insertError).toBeNull();
              expect(initialRecord).toBeDefined();
              expect(initialRecord!.completed_at).toBeNull();

              // Update is_completed to false again (no change)
              const { data: updatedRecord, error: updateError } = await supabaseTest
                .from('onboarding_progress')
                .update({ is_completed: false })
                .eq('id', initialRecord!.id)
                .select()
                .single();

              expect(updateError).toBeNull();
              expect(updatedRecord).toBeDefined();

              // Property: completed_at should remain null
              expect(updatedRecord!.completed_at).toBeNull();

            } finally {
              await cleanupTestUser(userId);
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });
});
