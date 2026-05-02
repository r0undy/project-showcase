import Image from "next/image";
import Link from "next/link";

interface TopNavProps {
  active?: "deploy" | "showcase";
}

export function TopNav({ active }: TopNavProps) {
  return (
    <nav
      className="fixed left-0 top-0 z-30 w-full border-b border-border/60 backdrop-blur-sm"
      style={{
        backgroundColor:
          "color-mix(in oklab, var(--background) 75%, var(--card) 25%)",
      }}
    >
      <div
        className="mx-auto grid w-full items-center"
        style={{
          padding: "0.85rem 2rem",
          gridTemplateColumns: "260px 1fr 260px",
          columnGap: "2.5rem",
        }}
      >
        <Link href="/" className="flex items-center" style={{ gap: "0.75rem" }}>
          <span className="relative inline-flex">
            <Image
              src="/awsccpup-logo-circle.webp"
              alt="AWS Cloud Club PUP Manila"
              width={40}
              height={40}
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              AWS Cloud Club
            </span>
            <span className="text-sm font-semibold text-foreground">
              PUP Manila
            </span>
          </span>
        </Link>

        <div
          className="flex items-center justify-center"
          style={{ gap: "2.75rem" }}
        >
          <Link
            href="/deploy-to-aws"
            className={`text-sm font-semibold transition ${
              active === "deploy"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="relative">
              Deployment Guides
              {active === "deploy" ? (
                <span
                  className="absolute left-0 top-full mt-1 h-0.5 w-full rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              ) : null}
            </span>
          </Link>
          <Link
            href="/showcase"
            className={`text-sm font-semibold transition ${
              active === "showcase"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="relative">
              Showcase
              {active === "showcase" ? (
                <span
                  className="absolute left-0 top-full mt-1 h-0.5 w-full rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              ) : null}
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/deploy-to-aws"
            className="text-sm font-semibold text-foreground"
            style={{
              borderRadius: "9999px",
              padding: "0.5rem 1.5rem",
              border:
                "1px solid color-mix(in oklab, var(--accent) 50%, transparent)",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--secondary) 90%, transparent), color-mix(in oklab, var(--primary) 18%, transparent))",
              boxShadow:
                "0 12px 26px -16px color-mix(in oklab, var(--glow-magenta) 70%, transparent)",
            }}
          >
            Deploy Guide
          </Link>
        </div>
      </div>
    </nav>
  );
}
