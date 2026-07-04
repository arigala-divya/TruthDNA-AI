import { z } from "zod";

export const MAX_ARTICLE_CHARS = 50_000;

export const investigateInputSchema = z
  .object({
    url: z.string().trim().max(2048).nullish(),
    articleText: z.string().trim().max(MAX_ARTICLE_CHARS, {
      message: `Article text is too long (max ${MAX_ARTICLE_CHARS.toLocaleString()} characters).`,
    }).nullish(),
  })
  .superRefine((data, ctx) => {
    const hasUrl = !!data.url;
    const hasText = !!data.articleText;
    if (!hasUrl && !hasText) {
      ctx.addIssue({
        code: "custom",
        message: "Please provide a news article URL or paste the article text.",
      });
      return;
    }
    if (hasUrl) {
      let parsed: URL;
      try {
        parsed = new URL(data.url!);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "That doesn't look like a valid URL. Include the full address, e.g. https://example.com/story.",
        });
        return;
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "Only http(s) URLs are supported.",
        });
      }
    }
    if (hasText && data.articleText!.length < 200) {
      ctx.addIssue({
        code: "custom",
        path: ["articleText"],
        message: "Article text is too short to investigate — paste at least a few paragraphs (200+ characters).",
      });
    }
  });

export type InvestigateInput = z.infer<typeof investigateInputSchema>;
