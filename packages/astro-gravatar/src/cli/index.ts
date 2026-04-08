#!/usr/bin/env bun
import { buildAvatarUrl, buildQRCodeUrl } from '../lib/gravatar.js';
import type { AvatarRating, DefaultAvatar } from '../lib/types.js';

const VERSION = '0.0.15';
const VALID_RATINGS: AvatarRating[] = ['g', 'pg', 'r', 'x'];
const VALID_DEFAULTS: DefaultAvatar[] = [
  '404',
  'mp',
  'identicon',
  'monsterid',
  'wavatar',
  'retro',
  'robohash',
  'blank',
];
const VALID_QR_VERSIONS = [1, 3] as const;
const VALID_QR_TYPES = ['user', 'gravatar', 'none'] as const;

function showHelp(): void {
  console.log(`
astro-gravatar CLI - Offline URL generation for Gravatar

Usage:
  astro-gravatar <command> [options]

Commands:
  generate-avatar    Generate a Gravatar avatar URL
  generate-qr        Generate a Gravatar QR code URL

Options:
  -h, --help         Show this help message
  -v, --version      Show version number

generate-avatar options:
  --email <email>          Email address (required)
  --size <pixels>          Avatar size (1-2048, default: 80)
  --rating <rating>        Content rating (g, pg, r, x, default: g)
  --default <type>         Default image type (404, mp, identicon, monsterid,
                           wavatar, retro, robohash, blank, default: mp)
  --force-default          Force default image (flag, no value)

generate-qr options:
  --email <email>          Email address (required)
  --size <pixels>          QR code size (1-1000, default: 80)
  --qr-version <1|3>       QR code version (1: standard, 3: dots, default: 1)
  --type <type>            Center icon type (user, gravatar, none, default: none)
  --utm-medium <medium>    UTM medium parameter
  --utm-campaign <name>    UTM campaign parameter

Examples:
  astro-gravatar generate-avatar --email user@example.com
  astro-gravatar generate-avatar --email user@example.com --size 200 --rating pg
  astro-gravatar generate-qr --email user@example.com --size 150 --qr-version 3
`);
}

function showVersion(): void {
  console.log(VERSION);
}

interface ParsedArgs {
  command: string | null;
  options: Record<string, string | boolean>;
  positional: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: null,
    options: {},
    positional: [],
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      result.options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.options.version = true;
    } else if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const eqIndex = arg.indexOf('=');
        const key = arg.slice(2, eqIndex).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const value = arg.slice(eqIndex + 1);
        result.options[key] = value;
      } else {
        const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

        if (arg === '--force-default') {
          result.options.forceDefault = true;
        } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          result.options[key] = argv[i + 1];
          i++;
        } else {
          result.options[key] = true;
        }
      }
    } else if (!arg.startsWith('-')) {
      if (!result.command) {
        result.command = arg;
      } else {
        result.positional.push(arg);
      }
    }
    i++;
  }

  return result;
}

function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function outputError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function validateEmail(email: string | undefined): string {
  if (!email) {
    outputError('Email is required. Use --email <email>');
  }

  if (!email!.includes('@')) {
    outputError('Invalid email format');
  }

  return email!;
}

function validateSize(size: string | undefined, min: number, max: number): number | undefined {
  if (!size) return undefined;

  const num = parseInt(size, 10);
  if (isNaN(num) || num < min || num > max) {
    outputError(`Size must be between ${min} and ${max}`);
  }

  return num;
}

function validateRating(rating: string | undefined): AvatarRating | undefined {
  if (!rating) return undefined;

  if (!VALID_RATINGS.includes(rating as AvatarRating)) {
    outputError(`Rating must be one of: ${VALID_RATINGS.join(', ')}`);
  }

  return rating as AvatarRating;
}

function validateDefault(defaultType: string | undefined): DefaultAvatar | undefined {
  if (!defaultType) return undefined;

  if (!VALID_DEFAULTS.includes(defaultType as DefaultAvatar)) {
    outputError(`Default must be one of: ${VALID_DEFAULTS.join(', ')}`);
  }

  return defaultType as DefaultAvatar;
}

function validateQrVersion(version: string | undefined): 1 | 3 | undefined {
  if (!version) return undefined;

  const num = parseInt(version, 10);
  if (!VALID_QR_VERSIONS.includes(num as 1 | 3)) {
    outputError(`Version must be one of: ${VALID_QR_VERSIONS.join(', ')}`);
  }

  return num as 1 | 3;
}

function validateQrType(type: string | undefined): 'user' | 'gravatar' | 'none' | undefined {
  if (!type) return undefined;

  if (!VALID_QR_TYPES.includes(type as 'user' | 'gravatar' | 'none')) {
    outputError(`Type must be one of: ${VALID_QR_TYPES.join(', ')}`);
  }

  return type as 'user' | 'gravatar' | 'none';
}

async function handleGenerateAvatar(options: Record<string, string | boolean>): Promise<void> {
  const email = validateEmail(options.email as string);
  const size = validateSize(options.size as string, 1, 2048);
  const rating = validateRating(options.rating as string);
  const defaultType = validateDefault(options.default as string);
  const forceDefault = options.forceDefault === true;

  const url = await buildAvatarUrl(email, {
    size,
    rating,
    default: defaultType,
    forceDefault,
  });

  outputJson({ url });
}

async function handleGenerateQr(options: Record<string, string | boolean>): Promise<void> {
  const email = validateEmail(options.email as string);
  const size = validateSize(options.size as string, 1, 1000);
  const version = validateQrVersion(options.qrVersion as string);
  const type = validateQrType(options.type as string);
  const utmMedium = options.utmMedium as string | undefined;
  const utmCampaign = options.utmCampaign as string | undefined;

  const url = await buildQRCodeUrl(email, {
    size,
    version,
    type,
    utmMedium,
    utmCampaign,
  });

  outputJson({ url });
}

async function main(argv: string[]): Promise<void> {
  const { command, options } = parseArgs(argv);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  if (!command) {
    outputError('No command provided. Use --help for usage information.');
  }

  switch (command) {
    case 'generate-avatar':
      await handleGenerateAvatar(options);
      break;
    case 'generate-qr':
      await handleGenerateQr(options);
      break;
    default:
      outputError(`Unknown command: ${command}. Use --help for usage information.`);
  }
}

main(process.argv.slice(2));
