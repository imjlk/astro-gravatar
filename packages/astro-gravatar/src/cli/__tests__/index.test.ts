import { describe, test, expect } from 'bun:test';
import { spawn } from 'child_process';

const CLI_PATH = require.resolve('../index.ts');
const TEST_EMAIL_HASH = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b';

async function runCli(
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('bun', ['run', CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 0,
      });
    });
  });
}

describe('CLI', () => {
  describe('generate-avatar command', () => {
    test('generates avatar URL with valid email', async () => {
      const result = await runCli(['generate-avatar', '--email', 'test@example.com']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('url');
      expect(output.url).toContain('gravatar.com/avatar/');
      expect(output.url).toContain(TEST_EMAIL_HASH);
    });

    test('generates avatar URL with size option', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--size',
        '200',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('s=200');
    });

    test('generates avatar URL with rating option', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--rating',
        'pg',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('r=pg');
    });

    test('generates avatar URL with default option', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--default',
        'identicon',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('d=identicon');
    });

    test('generates avatar URL with forceDefault option', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--force-default',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('f=y');
    });

    test('errors when email is missing', async () => {
      const result = await runCli(['generate-avatar']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error:');
      expect(result.stderr.toLowerCase()).toContain('email');
    });

    test('errors with invalid size (out of range)', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--size',
        '5000',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('size');
    });

    test('errors with invalid rating', async () => {
      const result = await runCli([
        'generate-avatar',
        '--email',
        'test@example.com',
        '--rating',
        'invalid',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('rating');
    });

    test('supports equals syntax for options', async () => {
      const result = await runCli(['generate-avatar', '--email=test@example.com', '--size=100']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain(TEST_EMAIL_HASH);
      expect(output.url).toContain('s=100');
    });
  });

  describe('generate-qr command', () => {
    test('generates QR code URL with valid email', async () => {
      const result = await runCli(['generate-qr', '--email', 'test@example.com']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('url');
      expect(output.url).toContain('gravatar.com/v3/qr-code/');
      expect(output.url).toContain(TEST_EMAIL_HASH);
    });

    test('generates QR code URL with size option', async () => {
      const result = await runCli(['generate-qr', '--email', 'test@example.com', '--size', '150']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('size=150');
    });

    test('generates QR code URL with qr-version option', async () => {
      const result = await runCli([
        'generate-qr',
        '--email',
        'test@example.com',
        '--qr-version',
        '3',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('version=3');
    });

    test('generates QR code URL with type option', async () => {
      const result = await runCli(['generate-qr', '--email', 'test@example.com', '--type', 'user']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('type=user');
    });

    test('generates QR code URL with UTM parameters', async () => {
      const result = await runCli([
        'generate-qr',
        '--email',
        'test@example.com',
        '--utm-medium',
        'web',
        '--utm-campaign',
        'profile_share',
      ]);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain('utm_medium=web');
      expect(output.url).toContain('utm_campaign=profile_share');
    });

    test('errors when email is missing', async () => {
      const result = await runCli(['generate-qr']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error:');
      expect(result.stderr.toLowerCase()).toContain('email');
    });

    test('errors with invalid size (out of range)', async () => {
      const result = await runCli(['generate-qr', '--email', 'test@example.com', '--size', '2000']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('size');
    });

    test('errors with invalid qr-version', async () => {
      const result = await runCli([
        'generate-qr',
        '--email',
        'test@example.com',
        '--qr-version',
        '5',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('version');
    });

    test('errors with invalid type', async () => {
      const result = await runCli([
        'generate-qr',
        '--email',
        'test@example.com',
        '--type',
        'invalid',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('type');
    });

    test('supports equals syntax for options', async () => {
      const result = await runCli(['generate-qr', '--email=test@example.com', '--size=100']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.url).toContain(TEST_EMAIL_HASH);
      expect(output.url).toContain('size=100');
    });
  });

  describe('general CLI behavior', () => {
    test('shows help with --help flag', async () => {
      const result = await runCli(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('usage');
    });

    test('shows help with -h flag', async () => {
      const result = await runCli(['-h']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('usage');
    });

    test('shows version with --version flag', async () => {
      const result = await runCli(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    test('errors with unknown command', async () => {
      const result = await runCli(['unknown-command']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('unknown');
    });

    test('errors when no command is provided', async () => {
      const result = await runCli([]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('command');
    });
  });
});
