import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";

export interface MarkdownHeading {
  /** 2 = `##`, 3 = `###`, 4 = `####`. We only surface 2 & 3 in the quick nav. */
  depth: 2 | 3 | 4;
  text: string;
  /** URL-friendly slug used as the heading's HTML `id` and the `#` anchor. */
  slug: string;
}

export interface DeployGuideSection {
  part: number;
  slug: string;
  title: string;
  content: string;
  /** Headings discovered in `content` — used to render the right-side quick nav. */
  headings: MarkdownHeading[];
}

const PART_FILES: Array<{
  part: number;
  slug: string;
  title: string;
  filename: string;
}> = [
  {
    part: 1,
    slug: "p1",
    title: "Receiving Your Credentials",
    filename: "part1.md",
  },
  {
    part: 2,
    slug: "p2",
    title: "Deploy with Amazon S3",
    filename: "part2.md",
  },
  {
    part: 3,
    slug: "p3",
    title: "Make It Secure with CloudFront",
    filename: "part3.md",
  },
  {
    part: 4,
    slug: "p4",
    title: "Celebrate & Share Your Build",
    filename: "part4.md",
  },
];

const resolvePartPath = (filename: string) =>
  path.join(process.cwd(), "aws-community-showcase", filename);

/**
 * Slugify a heading's text for use as an HTML id / hash anchor.
 * Mirrors what GitHub does for README headings (close enough — lowercases,
 * drops most punctuation, collapses whitespace into a single hyphen).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pull `##`, `###`, `####` headings out of a markdown string. Skips lines
 * inside fenced code blocks so headings-in-code-samples don't pollute the
 * outline. Slugs are deduped with a `-2`, `-3`, ... suffix on collision.
 */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const seen = new Map<string, number>();
  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{2,4})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const depth = match[1].length as 2 | 3 | 4;
    // Strip leading emoji + surrounding markdown decoration so the slug
    // doesn't carry it. Keep the original text for the visible label.
    const rawText = match[2].trim();
    const text = rawText
      .replace(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*)+/u, "")
      .trim();

    const baseSlug = slugify(text);
    if (!baseSlug) continue;

    const count = (seen.get(baseSlug) ?? 0) + 1;
    seen.set(baseSlug, count);
    const slug = count === 1 ? baseSlug : `${baseSlug}-${count}`;

    headings.push({ depth, text, slug });
  }

  return headings;
}

export const getDeployGuideSections = cache(
  async (includePart4: boolean = false): Promise<DeployGuideSection[]> => {
    const files = includePart4
      ? PART_FILES
      : PART_FILES.filter((p) => p.part !== 4);
    const sections = await Promise.all(
      files.map(async (part) => {
        const raw = await readFile(resolvePartPath(part.filename), "utf8");
        const content = raw.trim();
        return {
          ...part,
          content,
          headings: extractHeadings(content),
        } satisfies DeployGuideSection;
      }),
    );

    return sections;
  },
);

export const getDeployGuidePart = cache(
  async (slug?: string, includePart4: boolean = false): Promise<DeployGuideSection | null> => {
    if (!slug) {
      return null;
    }

    const match = slug.match(/^p?(\d+)$/);
    if (!match) {
      return null;
    }

    const partNumber = Number(match[1]);
    const sections = await getDeployGuideSections(includePart4);
    return sections.find((section) => section.part === partNumber) ?? null;
  },
);
