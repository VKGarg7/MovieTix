import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildSwaggerSpec } from './swaggerDefinition.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prebuiltPath = join(__dirname, 'swagger-spec.json');

// Prefer the spec pre-built at deploy time (scripts/generateSwaggerSpec.js) —
// serverless runtimes can't reliably glob-scan route files at request time.
// Falls back to a live scan for local dev so docs stay current without a
// rebuild step.
export const swaggerSpec = existsSync(prebuiltPath)
    ? JSON.parse(readFileSync(prebuiltPath, 'utf-8'))
    : buildSwaggerSpec();
