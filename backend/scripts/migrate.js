#!/usr/bin/env node
/**
 * Cross platform migration runner for Docker and local use.
 */
const { spawnSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');
const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
const FAILED_DOCUMENTS_MIGRATION = '20250629120000_add_documents';

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: opts.cwd ?? backendDir,
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runCaptured = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    cwd: backendDir,
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
};

const parseDatabaseHostPort = () => {
  const url = process.env.DATABASE_URL ?? '';

  try {
    const parsed = new URL(url.replace(/^postgresql:\/\//, 'http://'));
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 5432,
    };
  } catch {
    return { host: 'localhost', port: 5432 };
  }
};

const canConnect = (host, port, timeoutMs = 2000) =>
  new Promise((resolve) => {
    const client = net.createConnection({ host, port }, () => {
      client.end();
      resolve(true);
    });
    client.setTimeout(timeoutMs);
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
    client.on('error', () => resolve(false));
  });

const waitForDatabase = async (maxAttempts = 30) => {
  const { host, port } = parseDatabaseHostPort();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (await canConnect(host, port)) {
      console.log(`Database ready at ${host}:${port}`);
      return;
    }

    if (attempt >= maxAttempts) {
      throw new Error(
        `Database not reachable at ${host}:${port} after ${maxAttempts} attempts.`,
      );
    }

    console.log(`Database not ready (${host}:${port}). Retrying in 2s... (${attempt}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
};

const deployMigrations = () => {
  const result = runCaptured('npx', ['prisma', 'migrate', 'deploy', `--schema=${schemaPath}`]);
  if (result.status === 0) {
    return;
  }

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const isFailedDocuments =
    output.includes('P3009') && output.includes(FAILED_DOCUMENTS_MIGRATION);

  if (!isFailedDocuments) {
    process.exit(result.status ?? 1);
  }

  console.log(
    `Clearing failed ${FAILED_DOCUMENTS_MIGRATION} record, then retrying migrations...`,
  );
  run('npx', [
    'prisma',
    'migrate',
    'resolve',
    '--rolled-back',
    FAILED_DOCUMENTS_MIGRATION,
    `--schema=${schemaPath}`,
  ]);
  run('npx', ['prisma', 'migrate', 'deploy', `--schema=${schemaPath}`]);
};

const main = async () => {
  const migrationsDir = path.join(backendDir, 'prisma', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error(
      'No prisma/migrations folder found. Run locally first:\n' +
        '  docker compose exec backend npx prisma migrate dev --name init\n' +
        'Then commit backend/prisma/migrations before deploying to Coolify.',
    );
    process.exit(1);
  }

  await waitForDatabase();

  console.log('Generating Prisma Client...');
  run('npx', ['prisma', 'generate', `--schema=${schemaPath}`]);

  console.log('Running migrations...');
  deployMigrations();

  console.log('Migrations completed.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
