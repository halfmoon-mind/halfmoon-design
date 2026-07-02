import { test } from 'node:test';
import assert from 'node:assert/strict';
import StyleDictionary from 'style-dictionary';

test('깨진 참조는 빌드를 실패시킨다 (brokenReferences 기본값 = throw)', async () => {
  const sd = new StyleDictionary({
    source: ['test/fixtures/broken.tokens.json'],
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'test/fixtures/out/',
        files: [{ destination: 'x.css', format: 'css/variables' }],
      },
    },
  });
  await assert.rejects(() => sd.buildAllPlatforms(), /reference/i);
});
