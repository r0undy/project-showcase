'use client';

/**
 * LandingClient — owns the interactive bits of the landing hero. The primary
 * CTA routes signed-in users straight to /deploy-to-aws (they've already
 * onboarded) and unauthenticated visitors to /welcome for onboarding. When
 * the visitor is signed in, we also surface a secondary "Browse Showcase"
 * button so they can jump straight to the community wall.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
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
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <CTAButton
        onClick={() => router.push(isAuthenticated ? '/deploy-to-aws' : '/welcome')}
      />
      {isAuthenticated && (
        <motion.button
          type="button"
          onClick={() => router.push('/showcase')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{
            minWidth: '11rem',
            paddingInline: '1.75rem',
            height: '2.75rem',
            border: '1px solid color-mix(in oklab, var(--accent) 50%, transparent)',
            background: 'color-mix(in oklab, var(--card) 80%, transparent)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 12px 26px -16px color-mix(in oklab, var(--glow-magenta) 60%, transparent)',
          }}
          className="relative inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-foreground transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Go to Showcase
        </motion.button>
      )}
    </div>
  );
}
