import Anthropic from "@anthropic-ai/sdk";
import { resolveScrapeModel } from "@/lib/claude/models";

const MAX_PAGE_CHARS = 12_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidPublicUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.17.") ||
      host.startsWith("172.18.") ||
      host.startsWith("172.19.") ||
      host.startsWith("172.2") ||
      host.startsWith("172.30.") ||
      host.startsWith("172.31.") ||
      host === "[::1]"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function fetchPageText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "A-To-C/1.0 (aspiration requirements extractor; +https://a-to-c.app)",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch URL (${response.status})`);
  }

  const html = await response.text();
  const text = stripHtml(html);

  if (!text) {
    throw new Error("No readable text found at that URL");
  }

  return text.slice(0, MAX_PAGE_CHARS);
}

export async function extractRequirementsFromPage(
  pageText: string,
  sourceUrl: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to extract requirements from URLs."
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: resolveScrapeModel(),
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are helping a user define a personal development goal. Extract the key requirements, qualifications, deadlines, and success criteria from this web page content.

Source URL: ${sourceUrl}

Page content:
"""
${pageText}
"""

Return a concise, structured summary (bullet points) of what someone would need to meet or achieve to succeed with this program, role, or certification. Focus on concrete requirements — GPA, skills, experience, tests, documents, deadlines. Be direct and factual. If the page content is unclear, say what you could infer and what is missing.`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No response from Claude");
  }

  return block.text.trim();
}

export async function scrapeAspirationUrl(url: string): Promise<string> {
  const pageText = await fetchPageText(url);
  return extractRequirementsFromPage(pageText, url);
}
