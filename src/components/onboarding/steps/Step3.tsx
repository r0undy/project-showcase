"use client";

/**
 * Step 3 — "Workshop overview."
 *
 * Quick recap of learning goals, prerequisites, and the workshop flow.
 */

import { BookOpen, ClipboardList, Hammer } from "lucide-react";
import { motion } from "motion/react";
import { StepShell } from "./StepShell";

const SECTIONS: Array<{
  icon: typeof BookOpen;
  title: string;
  items: string[];
}> = [
  {
    icon: BookOpen,
    title: "What you'll learn",
    items: [
      "Set up Amazon S3 for static website hosting.",
      "Upload and deploy your portfolio's built files.",
      "Make your site publicly accessible.",
      "Put CloudFront in front of S3 for HTTPS and performance.",
      "Real-world AWS skills you can put on your resume.",
    ],
  },
  {
    icon: Hammer,
    title: "What you'll need",
    items: [
      "AWS credentials sent via email (CSV).",
      "A built portfolio website folder with index.html at the root.",
      "A modern web browser (Chrome, Edge, or Firefox).",
    ],
  },
  {
    icon: ClipboardList,
    title: "Workshop outline",
    items: [
      "Part 1 - Setup: Receive credentials and sign in to AWS.",
      "Part 2 - Deploy with S3: Get your portfolio live (HTTP).",
      "Part 3 - Secure with CloudFront: Add HTTPS via AWS's CDN.",
      "Part 4 - Celebrate: Share your live URL.",
    ],
  },
];

const itemVariants = {
  enter: { y: 14, opacity: 0, filter: "blur(4px)" },
  center: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { y: -8, opacity: 0, filter: "blur(4px)" },
};

export function Step3() {
  return (
    <StepShell
      eyebrow="WORKSHOP OVERVIEW"
      title="Know the plan before you start."
      lede="A quick snapshot of the learning goals, prerequisites, and the flow for the AWS deployment workshop."
    >
      <ul
        style={{ display: "grid", gap: "0.75rem" }}
        className="lg:grid-cols-3"
      >
        {SECTIONS.map(({ icon: Icon, title, items }) => (
          <motion.li
            key={title}
            variants={itemVariants}
            style={{
              padding: "clamp(0.75rem, 1.6vw, 1rem)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
            className="rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm"
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "1.625rem",
                  height: "1.625rem",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  background: "var(--card)",
                  boxShadow:
                    "inset 0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent)," +
                    " 0 0 10px -3px color-mix(in oklab, var(--glow-magenta) 50%, transparent)",
                }}
              >
                <Icon className="size-3.5" />
              </span>
              <span
                style={{ fontSize: "0.6875rem", letterSpacing: "0.18em" }}
                className="font-display uppercase text-foreground"
              >
                {title}
              </span>
            </div>
            <ul style={{ display: "grid", gap: "0.35rem" }}>
              {items.map((item) => (
                <li
                  key={item}
                  style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
                  className="text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ul>
    </StepShell>
  );
}
