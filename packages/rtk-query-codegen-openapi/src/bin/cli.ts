#!/usr/bin/env node

import { generateEndpoints, parseConfig } from '@rtk-query/codegen-openapi';
import program from 'commander';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(__filename);

/**
 * Makes `require` capable of loading a TypeScript config file.
 *
 * An explicitly installed transpiler wins over Node's built-in type stripping:
 * when `process.features.typescript` is `'strip'`, Node can only erase type
 * annotations, so syntax that needs a real transform (`enum`, `namespace`,
 * parameter properties) still requires esbuild-runner or ts-node.
 *
 * Only called for TypeScript config files - there is no reason to pay for
 * transpiler registration when loading a `.js` or `.json` config.
 *
 * @returns whether a TypeScript config file can now be loaded.
 */
function registerTypeScriptLoader(): boolean {
  try {
    if (require.resolve('esbuild') && require.resolve('esbuild-runner')) {
      require('esbuild-runner/register');
      return true;
    }
  } catch {}

  try {
    if (require.resolve('typescript') && require.resolve('ts-node')) {
      (require('ts-node') as typeof import('ts-node')).register({
        transpileOnly: true,
        compilerOptions: {
          target: 'es6',
          module: 'commonjs',
        },
      });
      return true;
    }
  } catch {}

  // Recent Node.js versions strip TypeScript types themselves, so `require` can
  // load the config with no extra tooling installed at all.
  return Boolean(process.features.typescript);
}

// tslint:disable-next-line
const meta = require('../../package.json');

program.version(meta.version).usage('</path/to/config.js>').parse(process.argv);

const configFile = program.args[0];

if (program.args.length === 0 || !/\.([mc]?(jsx?|tsx?)|jsonc?)?$/.test(configFile)) {
  program.help();
} else {
  if (/\.[mc]?tsx?$/.test(configFile) && !registerTypeScriptLoader()) {
    console.error(
      'Encountered a TypeScript configfile, but this version of Node.js cannot strip types and neither esbuild-runner nor ts-node are installed.'
    );
    process.exit(1);
  }
  run(resolve(process.cwd(), configFile));
}

async function run(configFile: string) {
  process.chdir(dirname(configFile));

  const unparsedConfig = require(configFile);

  for (const config of parseConfig(unparsedConfig.default ?? unparsedConfig)) {
    try {
      console.log(`Generating ${config.outputFile}`);
      await generateEndpoints(config);
      console.log(`Done`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}
