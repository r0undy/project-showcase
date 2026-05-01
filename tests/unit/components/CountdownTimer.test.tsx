/**
 * Unit tests — CountdownTimer (Task 15.4).
 *
 * Renders the component in jsdom and asserts: all four time-unit cells appear,
 * values reflect a target ~1 day out, the live region is wired correctly.
 *
 * The animation comes from `motion/react`. We let it run; jsdom doesn't actually
 * paint, but the rendered DOM stabilizes enough for these assertions.
 */

import { render, screen } from '@testing-library/react';
import { CountdownTimer } from '@/components/landing/CountdownTimer';

describe('<CountdownTimer />', () => {
  it('renders all four time-unit labels', () => {
    const target = new Date(Date.now() + 86_400_000).toISOString(); // +1 day
    render(<CountdownTimer targetDate={target} />);
    expect(screen.getByText(/days/i)).toBeInTheDocument();
    expect(screen.getByText(/hours/i)).toBeInTheDocument();
    expect(screen.getByText(/minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/seconds/i)).toBeInTheDocument();
  });

  it('exposes a live-updating timer region for screen readers', () => {
    const target = new Date(Date.now() + 60_000).toISOString();
    render(<CountdownTimer targetDate={target} />);
    const region = screen.getByRole('timer');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-label', expect.stringMatching(/time remaining/i));
  });

  it('shows zeros when the target is in the past', () => {
    const target = new Date(Date.now() - 60_000).toISOString();
    render(<CountdownTimer targetDate={target} />);
    // Each cell shows 00 (zero-padded).
    const zeros = screen.getAllByText('00');
    expect(zeros.length).toBe(4);
  });

  it('shows the correct days value for a target days in the future', () => {
    // Use a fixed, far-future fake "now" to avoid subsecond off-by-one between
    // the test's Date.now() and the component's internal Date.now().
    jest.useFakeTimers().setSystemTime(new Date('2026-05-01T00:00:00Z'));
    try {
      // +5 days exactly.
      const target = '2026-05-06T00:00:00Z';
      render(<CountdownTimer targetDate={target} />);
      // The days cell should read "05" (zero-padded).
      // Use getAllByText since the same string can appear elsewhere (e.g. "00").
      const cells = screen.getAllByText(/^\d{2}$/);
      const values = cells.map((el) => el.textContent);
      expect(values[0]).toBe('05');
    } finally {
      jest.useRealTimers();
    }
  });
});
