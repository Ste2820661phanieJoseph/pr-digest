import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { setActionOutputs, writeDigestFile, summarizeOutputs } from './outputs';

jest.mock('@actions/core', () => ({
  setOutput: jest.fn(),
  info: jest.fn(),
}));

const dateRange = { from: new Date('2024-01-01T00:00:00Z'), to: new Date('2024-01-07T23:59:59Z') };

describe('setActionOutputs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets all expected core outputs', () => {
    setActionOutputs({ markdownDigest: '## Hello', prCount: 5, dateRange });
    expect(core.setOutput).toHaveBeenCalledWith('markdown_digest', '## Hello');
    expect(core.setOutput).toHaveBeenCalledWith('pr_count', '5');
    expect(core.setOutput).toHaveBeenCalledWith('from_date', dateRange.from.toISOString());
    expect(core.setOutput).toHaveBeenCalledWith('to_date', dateRange.to.toISOString());
  });
});

describe('writeDigestFile', () => {
  const tmpPath = path.join(__dirname, '../tmp-test-output/digest.md');

  afterAll(() => {
    const dir = path.dirname(tmpPath);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  });

  it('writes content to the specified file path', async () => {
    const resolved = await writeDigestFile('# Digest Content', tmpPath);
    expect(fs.existsSync(resolved)).toBe(true);
    const content = fs.readFileSync(resolved, 'utf-8');
    expect(content).toBe('# Digest Content');
  });

  it('sets the output_file core output', async () => {
    await writeDigestFile('# Digest', tmpPath);
    expect(core.setOutput).toHaveBeenCalledWith('output_file', path.resolve(tmpPath));
  });
});

describe('summarizeOutputs', () => {
  it('returns a human-readable summary string', () => {
    const summary = summarizeOutputs({ markdownDigest: '', prCount: 3, dateRange });
    expect(summary).toContain('3 PR(s)');
    expect(summary).toContain(dateRange.from.toDateString());
    expect(summary).toContain(dateRange.to.toDateString());
  });
});
