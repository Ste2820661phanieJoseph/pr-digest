import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export interface DigestOutputs {
  markdownDigest: string;
  prCount: number;
  dateRange: { from: Date; to: Date };
  outputFile?: string;
}

export function setActionOutputs(outputs: DigestOutputs): void {
  core.setOutput('markdown_digest', outputs.markdownDigest);
  core.setOutput('pr_count', String(outputs.prCount));
  core.setOutput('from_date', outputs.dateRange.from.toISOString());
  core.setOutput('to_date', outputs.dateRange.to.toISOString());
  core.info(`Digest outputs set: ${outputs.prCount} PRs from ${outputs.dateRange.from.toISOString()} to ${outputs.dateRange.to.toISOString()}`);
}

export async function writeDigestFile(
  markdownContent: string,
  outputPath: string
): Promise<string> {
  const resolved = path.resolve(outputPath);
  const dir = path.dirname(resolved);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await fs.promises.writeFile(resolved, markdownContent, 'utf-8');
  core.info(`Digest written to ${resolved}`);
  core.setOutput('output_file', resolved);
  return resolved;
}

export function summarizeOutputs(outputs: DigestOutputs): string {
  const { prCount, dateRange } = outputs;
  const from = dateRange.from.toDateString();
  const to = dateRange.to.toDateString();
  return `Generated digest for ${prCount} PR(s) merged between ${from} and ${to}.`;
}
