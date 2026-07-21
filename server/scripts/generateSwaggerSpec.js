// Pre-builds the OpenAPI spec into a static JSON file at build time.
// Serverless (Vercel) deploys can't reliably glob-scan ./routes/*.js for
// JSDoc comments at runtime, so we do that scan once here and ship the
// resulting JSON instead — see configs/swagger.js.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildSwaggerSpec } from '../configs/swaggerDefinition.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'configs', 'swagger-spec.json');

const spec = buildSwaggerSpec();
writeFileSync(outPath, JSON.stringify(spec, null, 2));

console.log(`Swagger spec written to ${outPath} (${Object.keys(spec.paths || {}).length} paths)`);
