import { defineConfig, devices } from '@playwright/test';

// E2E는 빌드 결과(next start)를 테스트용 비밀번호로 띄워 검사한다
const PORT = 3100;
export const TEST_PASSWORD = 'e2e-test-password';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    httpCredentials: { username: 'coach', password: TEST_PASSWORD },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/brand/samkodong-logo-original.svg`,
    env: { SITE_PASSWORD: TEST_PASSWORD },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
