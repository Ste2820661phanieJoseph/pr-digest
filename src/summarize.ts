import Anthropic from "@anthropic-ai/sdk";

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  author: string;
  mergedAt: string;
  url: string;
  labels: string[];
}

export interface SummarizedPR extends PullRequest {
  summary: string;
}

const client = new Anthropic();

export async function summarizePR(pr: PullRequest): Promise<string> {
  const prompt = [
    `Summarize the following pull request in 1-2 concise sentences for a team changelog.`,
    `Focus on what changed and why it matters. Be direct and technical.`,
    ``,
    `PR #${pr.number}: ${pr.title}`,
    `Author: ${pr.author}`,
    pr.labels.length > 0 ? `Labels: ${pr.labels.join(", ")}` : "",
    ``,
    `Description:`,
    pr.body || "No description provided.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic API");
  }

  return content.text.trim();
}

export async function summarizePRs(
  prs: PullRequest[]
): Promise<SummarizedPR[]> {
  const results: SummarizedPR[] = [];

  for (const pr of prs) {
    const summary = await summarizePR(pr);
    results.push({ ...pr, summary });
  }

  return results;
}
