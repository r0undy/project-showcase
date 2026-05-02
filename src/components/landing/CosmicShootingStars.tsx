/**
 * Renders the staggered meteor shower used as a backdrop on the landing
 * hero and every "cosmic-bg" sub-route. Kept as its own component so the
 * positions/timings stay in lockstep across pages.
 */

const SHOOTING_STARS: Array<{
  top: string;
  right: string;
  delay: string;
  duration: string;
}> = [
  { top: '0',     right: '0',     delay: '0s',    duration: '2.5s' },
  { top: '0',     right: '120px', delay: '0.6s',  duration: '3s' },
  { top: '60px',  right: '0',     delay: '1.2s',  duration: '2s' },
  { top: '0',     right: '320px', delay: '1.8s',  duration: '2.8s' },
  { top: '0',     right: '600px', delay: '2.4s',  duration: '2.4s' },
  { top: '160px', right: '40px',  delay: '3.0s',  duration: '2.6s' },
];

export function CosmicShootingStars() {
  return (
    <>
      {SHOOTING_STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="cosmic-shooting-star"
          style={{
            top: s.top,
            right: s.right,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </>
  );
}
