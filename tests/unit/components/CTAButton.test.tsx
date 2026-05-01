/**
 * Unit tests — CTAButton (Task 15.4).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CTAButton } from '@/components/landing/CTAButton';

describe('<CTAButton />', () => {
  it('renders with the default "Get Started" label', () => {
    render(<CTAButton onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    render(<CTAButton onClick={() => {}} label="Join now" />);
    expect(screen.getByRole('button', { name: /join now/i })).toBeInTheDocument();
  });

  it('invokes onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<CTAButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard activatable (Enter / Space)', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<CTAButton onClick={onClick} />);
    const btn = screen.getByRole('button');
    btn.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
