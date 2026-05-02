'use client';

/**
 * LandingClient — owns the interactive bits of the landing hero. The CTA
 * routes signed-in users straight to /deploy-to-aws (they've already
 * onboarded) and unauthenticated visitors to /welcome for onboarding.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import { CTAButton } from './CTAButton';

export function LandingClient() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <CTAButton
      onClick={() => router.push(isAuthenticated ? '/deploy-to-aws' : '/welcome')}
    />
  );
}
