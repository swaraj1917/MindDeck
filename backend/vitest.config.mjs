@'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { JWT_SECRET: 'test-secret-for-vitest' },
  },
});
'@ | Set-Content -Path vitest.config.mjs -Encoding ascii