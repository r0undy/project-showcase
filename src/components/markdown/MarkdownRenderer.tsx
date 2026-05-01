import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { slugify } from "@/lib/markdown";

interface MarkdownRendererProps {
  content: string;
}

/** Walk a React subtree and stitch together its visible text — used to
 *  derive a stable slug for heading anchors that matches what the markdown
 *  extractor in lib/markdown.ts would generate. */
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node)) {
    const { children } = (node.props ?? {}) as { children?: ReactNode };
    return nodeToText(children ?? null);
  }
  return "";
}

/** Strip a leading emoji from a heading's visible text before slugging so
 *  the anchor matches lib/markdown.ts's `extractHeadings()`. */
const stripLeadingEmoji = (text: string) =>
  text
    .replace(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*)+/u, "")
    .trim();

const SCROLL_MARGIN = "6.5rem"; // clears the fixed TopNav when jumping via #anchor

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h1
            id={slugify(stripLeadingEmoji(nodeToText(children)))}
            style={{ scrollMarginTop: SCROLL_MARGIN }}
            className="font-display text-2xl uppercase tracking-[0.02em] text-foreground sm:text-3xl"
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            id={slugify(stripLeadingEmoji(nodeToText(children)))}
            style={{ scrollMarginTop: SCROLL_MARGIN }}
            className="mt-6 text-lg font-semibold text-foreground sm:text-xl"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            id={slugify(stripLeadingEmoji(nodeToText(children)))}
            style={{ scrollMarginTop: SCROLL_MARGIN }}
            className="mt-5 text-base font-semibold text-foreground sm:text-lg"
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4
            id={slugify(stripLeadingEmoji(nodeToText(children)))}
            style={{ scrollMarginTop: SCROLL_MARGIN }}
            className="mt-4 text-sm font-semibold text-foreground sm:text-base"
          >
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground sm:text-base">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground sm:text-base">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed text-muted-foreground">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              padding: "0.75rem",
              marginTop: "0.75rem",
              marginBottom: "0.75rem",
            }}
            className="rounded-lg border border-border/60 bg-card/60 text-sm text-muted-foreground"
          >
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = Boolean(className);
          if (isBlock) {
            return <code className="text-xs text-foreground">{children}</code>;
          }

          return (
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[0.75rem] text-foreground">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre
            style={{ padding: "0.875rem" }}
            className="overflow-x-auto rounded-lg border border-border/60 bg-card/60 text-xs text-foreground"
          >
            {children}
          </pre>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-accent underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          <img
            src={src ?? ""}
            alt={alt ?? ""}
            className="w-full rounded-lg border border-border/60"
          />
        ),
        hr: () => <hr className="my-6 border-border/60" />,
        table: ({ children }) => (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-xs text-muted-foreground sm:text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-secondary/60 text-foreground">{children}</thead>
        ),
        th: ({ children }) => (
          <th
            style={{ padding: "0.5rem" }}
            className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.08em]"
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{ padding: "0.5rem" }}
            className="border-b border-border/30"
          >
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
