import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import { MAX_ARTICLE_CHARS, type InvestigateInput } from "./validate";
import type { ArticleData } from "./types";

export class ScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapeError";
  }
}

const FETCH_TIMEOUT_MS = 15_000;

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TruthDNA-Investigator/1.0; +https://truthdna.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new ScrapeError(
        `The site returned ${res.status} ${res.statusText} — it may be blocking automated readers. Try pasting the article text instead.`
      );
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("xml")) {
      throw new ScrapeError(
        "That URL doesn't point to an HTML article. Try pasting the article text instead."
      );
    }
    return await res.text();
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ScrapeError("The site took too long to respond. Try pasting the article text instead.");
    }
    throw new ScrapeError(
      "Couldn't reach that URL. Check the address, or paste the article text instead."
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Extract article content + metadata from a URL, or wrap raw pasted text. */
export async function extractArticle(input: InvestigateInput): Promise<ArticleData> {
  if (input.url) {
    const html = await fetchHtml(input.url);
    // Silence jsdom's noisy CSS/script parse errors from real-world pages.
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", () => {});
    const dom = new JSDOM(html, { url: input.url, virtualConsole });
    const doc = dom.window.document;

    const article = new Readability(doc).parse();
    if (!article || !article.textContent || article.textContent.trim().length < 200) {
      throw new ScrapeError(
        "Couldn't extract a readable article from that page. It may be paywalled or heavily scripted — paste the article text instead."
      );
    }

    const publishedAt =
      article.publishedTime ||
      doc.querySelector('meta[property="article:published_time"]')?.getAttribute("content") ||
      doc.querySelector("time[datetime]")?.getAttribute("datetime") ||
      null;

    return {
      title: article.title?.trim() || doc.title || "Untitled article",
      author: article.byline?.trim() || null,
      siteName: article.siteName?.trim() || new URL(input.url).hostname.replace(/^www\./, ""),
      publishedAt: publishedAt && !isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString() : null,
      text: article.textContent.replace(/\s+\n/g, "\n").trim().slice(0, MAX_ARTICLE_CHARS),
      url: input.url,
      inputType: "url",
    };
  }

  const text = input.articleText!.trim();
  const firstLine = text.split("\n")[0].trim();
  return {
    title: firstLine.length > 8 && firstLine.length <= 160 ? firstLine : "Pasted article",
    author: null,
    siteName: null,
    publishedAt: null,
    text: text.slice(0, MAX_ARTICLE_CHARS),
    url: null,
    inputType: "text",
  };
}
