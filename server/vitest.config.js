import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        // starting the in-memory MongoDB binary can be slow on a cold cache (CI)
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
