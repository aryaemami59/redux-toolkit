import { exec as _exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { rimraf } from 'rimraf';

const exec = promisify(_exec);

const cliPath = process.env.TEST_DIST ? 'rtk-query-codegen-openapi' : `yarn cli`;

const cli = async (args: string[]) => {
  return await exec(`${cliPath} ${args.join(' ')}`);
};

const tmpDir = path.resolve(__dirname, 'tmp');

export const removeTempDir = async () => {
  await rimraf(tmpDir);
};

export const isDir = async (filePath: string) => {
  try {
    const stat = await fs.lstat(filePath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

describe('CLI options testing', () => {
  beforeAll(async () => {
    if (!(await isDir(tmpDir))) {
      await fs.mkdir(tmpDir, { recursive: true });
    }
  });

  afterEach(async () => {
    await rimraf(`${tmpDir}/*.ts`, { glob: true });
  });

  test('generation with `config.example.js`', { timeout: 25_000 }, async () => {
    const out = await cli(['./test/config.example.js']);

    expect(out).toEqual({
      stdout: `Generating ./tmp/example.ts
Done
`,
      stderr: '',
    });

    expect(await fs.readFile(path.resolve(tmpDir, 'example.ts'), 'utf-8')).toMatchSnapshot();
  });

  test('paths are relative to config file, not to cwd', { timeout: 25_000 }, async () => {
    const out = await cli([`./test/config.example.js`]);

    expect(out).toEqual({
      stdout: `Generating ./tmp/example.ts
Done
`,
      stderr: '',
    });

    expect(await fs.readFile(path.resolve(tmpDir, 'example.ts'), 'utf-8')).toMatchSnapshot();
  });

  test('ts, js and json all work the same', { timeout: 120_000 }, async () => {
    await cli([`./test/config.example.js`]);
    const fromJs = await fs.readFile(path.resolve(tmpDir, 'example.ts'), 'utf-8');
    await cli([`./test/config.example.ts`]);
    const fromTs = await fs.readFile(path.resolve(tmpDir, 'example.ts'), 'utf-8');
    await cli([`./test/config.example.json`]);
    const fromJson = await fs.readFile(path.resolve(tmpDir, 'example.ts'), 'utf-8');

    expect(fromTs).toEqual(fromJs);
    expect(fromJson).toEqual(fromJs);
  });

  // The extension is checked before the file is ever read, so these paths need not exist.
  test.for([
    ['./test/config.example.yaml', 'unsupported format'],
    ['./test/config.example.jsonc', 'jsonc is not loadable by require()'],
    ['./test/config.example.js.bak', 'unknown trailing extension'],
    ['./test/config.example.', 'trailing dot with no extension'],
    ['./test/config.example.mjsx', 'not a real extension'],
    ['./test/config.example', 'no extension at all'],
  ] as const)('rejects `%s` with the usage message (%s)', { timeout: 25_000 }, async ([configFile], { expect }) => {
    const out = await cli([configFile]);

    expect(out.stdout).toContain('Usage: cli </path/to/config.js>');
    expect(out.stderr).toBe('');
  });

  test("missing parameters doesn't fail", { timeout: 25_000 }, async () => {
    await expect(() => cli([`./test/config.invalid-example.json`])).rejects.toThrowError(
      "Error: path parameter petId does not seem to be defined in '/pet/{petId}'!"
    );
  });
});
