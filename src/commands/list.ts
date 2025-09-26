import { listCacheEntries } from '../core/github';

/**
 * List all cache entries
 */
export async function listCaches(token: string, owner?: string, repo?: string) {
  try {
    const entries = await listCacheEntries(token, owner, repo);
    if (entries.length === 0) {
      console.log('No cache entries found.');
      return [];
    }

    console.log('Cache entries:');
    entries.forEach((entry) => {
      console.log(`- Key: ${entry.key}, Version: ${entry.version}, Ref: ${entry.ref}, Size: ${entry.size} bytes`);
    });

    return entries;
  } catch (err) {
    console.error('Failed to list cache entries:', err);
    throw err;
  }
}