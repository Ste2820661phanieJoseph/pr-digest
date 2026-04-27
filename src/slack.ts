import * as https from 'https';
import * as http from 'http';

export interface SlackPayload {
  text?: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  accessory?: object;
}

export async function postToSlack(
  webhookUrl: string,
  payload: SlackPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const url = new URL(webhookUrl);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res: http.IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(
            new Error(
              `Slack webhook returned status ${res.statusCode}: ${data}`
            )
          );
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export function buildSlackPayload(markdownContent: string): SlackPayload {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: markdownContent,
      },
    },
  ];

  return {
    username: 'PR Digest',
    icon_emoji: ':newspaper:',
    blocks,
  };
}
