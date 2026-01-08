#!/usr/bin/env node

/**
 * Creates an example output file in the project root.
 * This script is idempotent - safe to run multiple times.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, 'example-output.txt');

const content = `Example output file
Generated at: ${new Date().toISOString()}
`;

writeFileSync(outputPath, content, 'utf-8');
console.log(`Successfully created: ${outputPath}`);
