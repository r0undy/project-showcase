'use client';

/**
 * LandingClient — owns the interactive bits of the landing hero. The CTA
 * navigates to /welcome (a real page route, not a modal) so the onboarding
 * flow is shareable/back-navigable.
 */

import { useRouter } from 'next/navigation';
import { CountdownTimer } from './CountdownTimer';
import { CTAButton } from './CTAButton';

interface LandingClientProps {
  targetDate: string;
}

export function LandingClient({ targetDate }: LandingClientProps) {
  const router = useRouter();

  return (
    <>
      <CountdownTimer targetDate={targetDate} />

      <CTAButton onClick={() => router.push('/welcome')} />
    </>
  );
}
