/**
 * /welcome — the dedicated onboarding route.
 *
 * Replaces the previous modal. Same cosmic background as the landing page,
 * with the OnboardingFlow card centered on top. Server Component owns the
 * route metadata; the actual interactive UI lives in WelcomeClient.
 */

import type { Metadata } from 'next';
import { WelcomeClient } from './WelcomeClient';

export const metadata: Metadata = {
  title: 'Welcome · From Vibe to Live',
  description:
    'Pick a username, set up your environment, and get ready to deploy your portfolio with AWS.',
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
