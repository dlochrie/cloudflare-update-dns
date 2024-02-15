#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const yargs = require('yargs/yargs');

const CloudflareUpdater = require('../dist').default;
const { MESSAGES } = require('../dist/constants');

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 <command> [options]')
  .command('cloudflare-update-dns', 'Update Cloudflare DNS with your IP address.')
  .example('$0 cloudflare-update-dns -c /path/to/config.json', 'update Cloudflare DNS using provided config.json')
  .alias('c', 'config')
  .help('h')
  .alias('h', 'help')
  .parse();

// Determine path to config file. If no option passed, default to a local config.json.
const configFile = argv.c ? path.resolve(argv.c) : path.resolve('config.json');

(async () => {
  if (fs.existsSync(configFile)) {
    try {
      const cloudflareUpdater = new CloudflareUpdater(configFile);
      await cloudflareUpdater.exec();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else {
    console.error(MESSAGES.ERR_CONFIG_MISSING);
    process.exit(1);
  }

  // Success.
  process.exit(0);
})();
