import { clearEntry } from '../core/github';


/**
 * Delete a specific cache entry
 */
export async function deleteCacheEntry(key: string, version: string, token: string, owner?: string, repo?: string) {
  try {
    const success = await clearEntry(key, version, token, owner, repo);
    if (success) {
      console.log(`Cache entry deleted successfully ✅`);
    } else {
      console.error('Failed to delete cache entry ❌');
      throw new Error('Delete failed');
    }
  } catch (err) {
    console.error('Error deleting cache entry:', err);
    throw err;
  }
}