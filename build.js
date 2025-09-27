#!/usr/bin/env node

const { Command } = require('commander');
const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('build')
  .description('Build different scripts with embedded arguments.')
  .option('-c, --config <path>', 'Path to a specific config file for build', 'config.json')
  .parse(process.argv);

const options = program.opts();
const configPath = options.config;

const distDir = path.resolve(__dirname, 'dist');
fs.mkdirSync(distDir, { recursive: true });

/**
 * Load JSON config from file
 */
function loadConfig(configPath) {
  const resolved = path.resolve(configPath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ Config file not found: ${resolved}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

/**
 * Build CLI
 */
async function buildCli() {
  const outfile = path.join(distDir, 'cachaca-cli.js');
  console.log(`📦 Building cli → ${outfile}`);

  await build({
    entryPoints: ['./src/cli.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    minify: true,
    loader: {
      '.zstd': 'binary',
      '.py': 'text',
    },
  });
}

/**
 * Build dumper
 */
async function buildDumper(exfilUrl) {
  const outfile = path.join(distDir, 'cachaca-dumper.js');
  console.log(`📦 Building dumper → ${outfile}`);

  await build({
    entryPoints: ['./src/dumper.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    minify: true,
    loader: {
      '.zstd': 'binary',
      '.py': 'text',
    },
    define: {
      EMBEDDED_EXFIL_URL: JSON.stringify(exfilUrl),
    },
  });
}

/**
 * Build poisoner
 */
async function buildPoisoner(fetchMode, fetchValue, cacheKey, cacheVersion) {
  const outfile = path.join(distDir, 'cachaca-poisoner.js');
  console.log(`📦 Building poisoner → ${outfile}`);

  if(fetchMode.toLowerCase() == "embedded"){
    const zstdFileName = addFileToAssets(fetchValue)
    fetchValue = "../../assets/" + zstdFileName
  }

  await build({
    entryPoints: ['./src/poisoner.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    minify: true,
    loader: {
      '.zstd': 'binary',
      '.py': 'text',
    },
    define: {
      EMBEDDED_FETCH_MODE: JSON.stringify(fetchMode),
      EMBEDDED_FETCH_MODE_VALUE: JSON.stringify(fetchValue),
      EMBEDDED_CACHE_KEY: JSON.stringify(cacheKey),
      EMBEDDED_CACHE_VERSION: JSON.stringify(cacheVersion),
    },
  });
}

/**
 * Add file to assets
 * @param {string} srcPath - full path to the source file
 * @returns {string|null} filename if moved, null if file doesn't exist
 */
function addFileToAssets(srcPath) {
  if (!fs.existsSync(srcPath)) {
    console.log(`File does not exist: ${srcPath}`);
    return null;
  }

  const filename = path.basename(srcPath);
  const destPath = path.join("./assets", filename);

  // Move file
  fs.copyFileSync(srcPath, destPath);

  return filename;
}

async function runBuilds() {
  const config = loadConfig(configPath);
  await buildCli();
  await buildDumper(config.dumperExfilUrl);
  await buildPoisoner(config.poisonerFetchMode, config.poisonerFetchModeValue, config.poisonerCacheKey, config.poisonerCacheVersion);
}

runBuilds().catch(err => {
  console.error('❌ Build process failed:', err);
  process.exit(1);
});
