# Halfmoon Phase 0 — 토큰 기반 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DTCG 2025.10 토큰 소스 + Style Dictionary v5 빌드(CSS/TS) + 가이드라인 문서 + CI를 갖춘, git 태그로 소비 가능한 `@playtag/halfmoon-tokens` 패키지를 v0.1.0으로 태그한다.

**Architecture:** 레포 루트가 곧 tokens 패키지다 (스펙 §6). 손저작 DTCG JSON(primitive + semantic/halfmoon/{light,dark})을 `build/build.mjs`가 Style Dictionary v5 인스턴스 2개(light/dark)로 빌드해 `dist/halfmoon/`에 CSS 3파일과 JS+d.ts를 생성한다. dist/는 커밋된다.

**Tech Stack:** Node.js ≥20 (ESM), style-dictionary 5.5.0 (정확히 고정), node:test (테스트 프레임워크 없음), GitHub Actions.

## Global Constraints

스펙: `docs/superpowers/specs/2026-07-02-halfmoon-design-system-design.md`

- 토큰 포맷: **DTCG 2025.10 객체 형식만** — color는 `{"colorSpace":"srgb","components":[r,g,b],"alpha":1,"hex":"#…"}`, dimension은 `{"value":16,"unit":"px"}`, typography는 composite. 구식 문자열(`"16px"`, bare hex) 금지.
- **DTCG Resolver 모듈 사용 금지** (draft). 모드는 SD 멀티 파일 관례로.
- `style-dictionary`는 **5.5.0 정확히 고정** (`--save-exact`).
- CSS 변수 접두사 **`--hm-`** (SD platform `prefix: 'hm'`). TS 객체는 접두사 없음.
- **dist/는 항상 커밋** (릴리스 태그 커밋에 포함되어야 함). `prepare` 스크립트 금지 (pnpm 10.26+ 차단).
- **`brokenReferences` 기본값(throw)을 낮추지 말 것.** dark 빌드의 의도적 토큰 충돌 경고만 침묵 가능.
- semantic 토큰만 모드별로 바뀐다. `dark.tokens.json`은 **바뀌는 토큰만** 담는다. primitive는 모드 무관.
- 패키지명 `@playtag/halfmoon-tokens`, 기본 테마명 `halfmoon`, 모든 파일 ESM.
- 토큰 소스는 전부 DTCG(`$value`/`$type`) — legacy(value/type) 문법 혼용 금지. SD의 DTCG 감지는 인스턴스 전역이라 혼용 시 깨진다.
- 커밋 메시지는 conventional commits (`feat:`, `test:`, `docs:`, `ci:`, `chore:`).
- 스펙 §5의 "tokens.ts(.d.ts)"는 **`tokens.js` + `tokens.d.ts`(리터럴 타입)로 구현**한다 — .ts 소스 배포는 비-TS 소비자와 Vite의 node_modules 처리에서 깨지기 때문. 리터럴 타입은 d.ts가 담당하므로 `as const` 의도를 충족한다.

---

### Task 1: 패키지 스캐폴드

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: npm 패키지 뼈대. exports 맵 서브패스 — `@playtag/halfmoon-tokens/halfmoon`(JS/TS), `…/halfmoon/tokens.css`, `…/halfmoon/light.css`, `…/halfmoon/dark.css`. npm 스크립트 `build`/`test`/`check`. 이후 모든 태스크가 이 스크립트를 사용.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "@playtag/halfmoon-tokens",
  "version": "0.0.0",
  "description": "halfmoon design system — design tokens (DTCG source of truth)",
  "type": "module",
  "license": "UNLICENSED",
  "files": ["dist"],
  "exports": {
    "./halfmoon/tokens.css": "./dist/halfmoon/tokens.css",
    "./halfmoon/light.css": "./dist/halfmoon/light.css",
    "./halfmoon/dark.css": "./dist/halfmoon/dark.css",
    "./halfmoon": {
      "types": "./dist/halfmoon/tokens.d.ts",
      "default": "./dist/halfmoon/tokens.js"
    }
  },
  "scripts": {
    "build": "node build/build.mjs",
    "test": "node --test test/",
    "check": "npm run build && npm test"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 2: .gitignore 작성** — dist/는 커밋 대상이므로 절대 넣지 않는다

```
node_modules/
```

- [ ] **Step 3: README.md 작성**

```markdown
# halfmoon

playtag 프로젝트들의 공통 디자인 시스템. 단일 소스는 DTCG 토큰(`src/`)이며,
빌드가 웹용 CSS 변수와 타입된 JS 객체를 생성한다(`dist/`, 커밋됨).

- 설계 스펙: `docs/superpowers/specs/2026-07-02-halfmoon-design-system-design.md`
- 사용법: `docs/consuming-web.md`
- 토큰 규칙: `docs/naming.md`

## 개발

```bash
npm ci
npm run check   # build + test
```

## 릴리스

```bash
npm run check
git add dist && git commit -m "chore: rebuild dist"   # dist 변경이 있을 때
npm version 0.1.0                                      # 커밋 + v0.1.0 태그 생성
```
```

- [ ] **Step 4: style-dictionary 설치 (정확히 고정)**

Run: `npm install --save-dev --save-exact style-dictionary@5.5.0`
Expected: package.json devDependencies에 `"style-dictionary": "5.5.0"`, package-lock.json 생성

- [ ] **Step 5: 설치 검증**

Run: `node -e "import('style-dictionary').then(m => console.log('SD OK', m.default.VERSION ?? 'v5'))"`
Expected: `SD OK …` 출력, exit 0

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore README.md
git commit -m "chore: scaffold @playtag/halfmoon-tokens package"
```

---

### Task 2: Primitive 토큰

**Files:**
- Create: `src/primitive/color.tokens.json` (스크립트로 생성)
- Create: `src/primitive/dimension.tokens.json`
- Create: `src/primitive/typography.tokens.json`

**Interfaces:**
- Produces: 별칭 대상이 되는 primitive 토큰 경로들 — `color.{white,black}`, `color.{gray,blue,red,green,amber}.<step>`, `space.{0,1,2,3,4,5,6,8,10,12,16}`, `radius.{sm,md,lg,xl,full}`, `size.font.{xs,sm,md,lg,xl,2xl,3xl,4xl}`, `font.family.{sans,mono}`, `font.weight.{regular,medium,semibold,bold}`, `font.lineHeight.{tight,normal,relaxed}`, `typography.heading.{lg,md,sm}`, `typography.body.{md,sm}`, `typography.caption`. Task 3의 semantic 별칭과 Task 4·5의 빌드가 이 경로를 참조.

- [ ] **Step 1: color 토큰 생성 스크립트 작성** — hex → DTCG 객체 변환을 손으로 하지 않기 위한 1회용 부트스트랩

Create `scripts/gen-color-tokens.mjs`:

```js
// 1회용: hex 팔레트 -> DTCG 2025.10 color 객체. 실행 후 삭제한다 (소스는 JSON).
import { mkdirSync, writeFileSync } from 'node:fs';

const ramps = {
  gray:  { 50:'f8fafc',100:'f1f5f9',200:'e2e8f0',300:'cbd5e1',400:'94a3b8',500:'64748b',600:'475569',700:'334155',800:'1e293b',900:'0f172a',950:'020617' },
  blue:  { 50:'eff6ff',100:'dbeafe',200:'bfdbfe',300:'93c5fd',400:'60a5fa',500:'3b82f6',600:'2563eb',700:'1d4ed8',800:'1e40af',900:'1e3a8a' },
  red:   { 50:'fef2f2',400:'f87171',500:'ef4444',600:'dc2626',700:'b91c1c' },
  green: { 50:'f0fdf4',400:'4ade80',500:'22c55e',600:'16a34a',700:'15803d' },
  amber: { 50:'fffbeb',400:'fbbf24',500:'f59e0b',600:'d97706' },
};
const singles = { white: 'ffffff', black: '000000' };

const toToken = (hex) => {
  const n = parseInt(hex, 16);
  const components = [16, 8, 0].map((s) => Math.round(((n >> s) & 255) / 255 * 1e4) / 1e4);
  return { $value: { colorSpace: 'srgb', components, alpha: 1, hex: `#${hex}` } };
};

const color = { $type: 'color' };
for (const [name, hex] of Object.entries(singles)) color[name] = toToken(hex);
for (const [name, ramp] of Object.entries(ramps)) {
  color[name] = {};
  for (const [step, hex] of Object.entries(ramp)) color[name][step] = toToken(hex);
}

mkdirSync('src/primitive', { recursive: true });
writeFileSync('src/primitive/color.tokens.json', JSON.stringify({ color }, null, 2) + '\n');
console.log('wrote src/primitive/color.tokens.json');
```

- [ ] **Step 2: 실행 후 스크립트 삭제**

Run: `node scripts/gen-color-tokens.mjs && rm -rf scripts && node -e "const c=JSON.parse(require('node:fs').readFileSync('src/primitive/color.tokens.json'));console.log(c.color.blue['600'].$value.hex, c.color.blue['600'].$value.components.join(','))"`
Expected: `#2563eb 0.1451,0.3882,0.9216`

- [ ] **Step 3: dimension.tokens.json 작성**

```json
{
  "space": {
    "$type": "dimension",
    "0": { "$value": { "value": 0, "unit": "px" } },
    "1": { "$value": { "value": 4, "unit": "px" } },
    "2": { "$value": { "value": 8, "unit": "px" } },
    "3": { "$value": { "value": 12, "unit": "px" } },
    "4": { "$value": { "value": 16, "unit": "px" } },
    "5": { "$value": { "value": 20, "unit": "px" } },
    "6": { "$value": { "value": 24, "unit": "px" } },
    "8": { "$value": { "value": 32, "unit": "px" } },
    "10": { "$value": { "value": 40, "unit": "px" } },
    "12": { "$value": { "value": 48, "unit": "px" } },
    "16": { "$value": { "value": 64, "unit": "px" } }
  },
  "radius": {
    "$type": "dimension",
    "sm": { "$value": { "value": 4, "unit": "px" } },
    "md": { "$value": { "value": 8, "unit": "px" } },
    "lg": { "$value": { "value": 12, "unit": "px" } },
    "xl": { "$value": { "value": 16, "unit": "px" } },
    "full": { "$value": { "value": 9999, "unit": "px" } }
  },
  "size": {
    "font": {
      "$type": "dimension",
      "xs": { "$value": { "value": 12, "unit": "px" } },
      "sm": { "$value": { "value": 14, "unit": "px" } },
      "md": { "$value": { "value": 16, "unit": "px" } },
      "lg": { "$value": { "value": 18, "unit": "px" } },
      "xl": { "$value": { "value": 20, "unit": "px" } },
      "2xl": { "$value": { "value": 24, "unit": "px" } },
      "3xl": { "$value": { "value": 30, "unit": "px" } },
      "4xl": { "$value": { "value": 36, "unit": "px" } }
    }
  }
}
```

- [ ] **Step 4: typography.tokens.json 작성** — 폰트 로딩은 소비자 책임; 스택은 Pretendard 우선, 시스템 폰트 폴백

```json
{
  "font": {
    "family": {
      "$type": "fontFamily",
      "sans": { "$value": ["Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"] },
      "mono": { "$value": ["JetBrains Mono", "SF Mono", "D2Coding", "ui-monospace", "monospace"] }
    },
    "weight": {
      "$type": "fontWeight",
      "regular": { "$value": 400 },
      "medium": { "$value": 500 },
      "semibold": { "$value": 600 },
      "bold": { "$value": 700 }
    },
    "lineHeight": {
      "$type": "number",
      "tight": { "$value": 1.25 },
      "normal": { "$value": 1.5 },
      "relaxed": { "$value": 1.625 }
    }
  },
  "typography": {
    "$type": "typography",
    "heading": {
      "lg": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.3xl}", "fontWeight": "{font.weight.bold}", "lineHeight": "{font.lineHeight.tight}" } },
      "md": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.2xl}", "fontWeight": "{font.weight.semibold}", "lineHeight": "{font.lineHeight.tight}" } },
      "sm": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.xl}", "fontWeight": "{font.weight.semibold}", "lineHeight": "{font.lineHeight.tight}" } }
    },
    "body": {
      "md": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.md}", "fontWeight": "{font.weight.regular}", "lineHeight": "{font.lineHeight.normal}" } },
      "sm": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.sm}", "fontWeight": "{font.weight.regular}", "lineHeight": "{font.lineHeight.normal}" } }
    },
    "caption": { "$value": { "fontFamily": "{font.family.sans}", "fontSize": "{size.font.xs}", "fontWeight": "{font.weight.regular}", "lineHeight": "{font.lineHeight.normal}" } }
  }
}
```

- [ ] **Step 5: JSON 유효성 검증**

Run: `for f in src/primitive/*.tokens.json; do node -e "JSON.parse(require('node:fs').readFileSync('$f'))" && echo "OK $f"; done`
Expected: 3개 파일 모두 `OK`

- [ ] **Step 6: Commit**

```bash
git add src/primitive
git commit -m "feat: add primitive tokens (color, dimension, typography)"
```

---

### Task 3: Semantic 토큰 (halfmoon 테마, light + dark)

**Files:**
- Create: `src/semantic/halfmoon/light.tokens.json`
- Create: `src/semantic/halfmoon/dark.tokens.json`

**Interfaces:**
- Consumes: Task 2의 primitive 경로 (`{color.gray.50}` 등 별칭)
- Produces: semantic 색 역할 경로 — `color.bg.{default,subtle,muted,inverted}`, `color.fg.{default,muted,subtle,inverted,link}`, `color.border.{default,strong,focus}`, `color.action.primary.{bg,hover,fg}`, `color.status.{danger,success,warning}`. **제품 코드는 이 경로만 사용한다.** dark 파일은 light와 동일 경로의 부분집합(바뀌는 것만).

- [ ] **Step 1: light.tokens.json 작성**

```json
{
  "color": {
    "$type": "color",
    "bg": {
      "default": { "$value": "{color.white}" },
      "subtle": { "$value": "{color.gray.50}" },
      "muted": { "$value": "{color.gray.100}" },
      "inverted": { "$value": "{color.gray.900}" }
    },
    "fg": {
      "default": { "$value": "{color.gray.900}" },
      "muted": { "$value": "{color.gray.600}" },
      "subtle": { "$value": "{color.gray.400}" },
      "inverted": { "$value": "{color.white}" },
      "link": { "$value": "{color.blue.600}" }
    },
    "border": {
      "default": { "$value": "{color.gray.200}" },
      "strong": { "$value": "{color.gray.300}" },
      "focus": { "$value": "{color.blue.500}" }
    },
    "action": {
      "primary": {
        "bg": { "$value": "{color.blue.600}" },
        "hover": { "$value": "{color.blue.700}" },
        "fg": { "$value": "{color.white}" }
      }
    },
    "status": {
      "danger": { "$value": "{color.red.600}" },
      "success": { "$value": "{color.green.600}" },
      "warning": { "$value": "{color.amber.500}" }
    }
  }
}
```

- [ ] **Step 2: dark.tokens.json 작성** — light와 같은 경로, 바뀌는 토큰만

```json
{
  "color": {
    "$type": "color",
    "bg": {
      "default": { "$value": "{color.gray.950}" },
      "subtle": { "$value": "{color.gray.900}" },
      "muted": { "$value": "{color.gray.800}" },
      "inverted": { "$value": "{color.gray.50}" }
    },
    "fg": {
      "default": { "$value": "{color.gray.50}" },
      "muted": { "$value": "{color.gray.400}" },
      "subtle": { "$value": "{color.gray.500}" },
      "inverted": { "$value": "{color.gray.900}" },
      "link": { "$value": "{color.blue.400}" }
    },
    "border": {
      "default": { "$value": "{color.gray.800}" },
      "strong": { "$value": "{color.gray.700}" }
    },
    "action": {
      "primary": {
        "bg": { "$value": "{color.blue.500}" },
        "hover": { "$value": "{color.blue.400}" }
      }
    },
    "status": {
      "danger": { "$value": "{color.red.500}" },
      "success": { "$value": "{color.green.500}" },
      "warning": { "$value": "{color.amber.400}" }
    }
  }
}
```

주의: `border.focus`, `action.primary.fg`는 다크에서 바뀌지 않으므로 dark 파일에 없다 — 이것이 "바뀌는 것만" 규칙의 예시다.

- [ ] **Step 3: JSON 유효성 + 별칭 대상 존재 검증** (참조 무결성의 본검증은 Task 4의 SD 빌드)

Run:

```bash
node -e "
const fs = require('node:fs');
const prim = {};
for (const f of fs.readdirSync('src/primitive')) Object.assign(prim, JSON.parse(fs.readFileSync('src/primitive/'+f)));
const paths = new Set();
(function walk(o, p) { for (const [k,v] of Object.entries(o)) { if (k.startsWith('$')) continue; if (v && v.\$value !== undefined) paths.add([...p,k].join('.')); else if (typeof v === 'object') walk(v, [...p,k]); } })(prim, []);
let bad = 0;
for (const f of ['src/semantic/halfmoon/light.tokens.json','src/semantic/halfmoon/dark.tokens.json']) {
  const doc = JSON.parse(fs.readFileSync(f));
  (function walk(o) { for (const [k,v] of Object.entries(o)) { if (k === '\$value' && typeof v === 'string') { const ref = v.slice(1,-1); if (!paths.has(ref)) { console.error('MISSING', ref, 'in', f); bad++; } } else if (v && typeof v === 'object') walk(v); } })(doc);
}
process.exit(bad ? 1 : 0)"
echo "refs OK"
```

Expected: `refs OK`, exit 0

- [ ] **Step 4: Commit**

```bash
git add src/semantic
git commit -m "feat: add halfmoon semantic tokens (light + dark)"
```

---

### Task 4: Style Dictionary 빌드 — CSS 출력

**Files:**
- Create: `test/css-output.test.mjs`
- Create: `build/build.mjs`

**Interfaces:**
- Consumes: Task 2·3의 토큰 소스
- Produces: `dist/halfmoon/light.css`(`:root`, 전체 토큰), `dist/halfmoon/dark.css`(`[data-theme="dark"]`, dark 파일 토큰만), `dist/halfmoon/tokens.css`(@import 인덱스). `build/build.mjs`는 Task 5가 js 플랫폼을 추가할 파일. 변수명 형식: `--hm-<path-kebab>` (예: `--hm-color-bg-default`, `--hm-space-4`).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `test/css-output.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f) => readFileSync(`dist/halfmoon/${f}`, 'utf8');

test('light.css: :root 아래 접두사 변수, primitive+semantic 모두 포함', () => {
  const css = read('light.css');
  assert.match(css, /:root\s*\{/);
  assert.match(css, /--hm-color-bg-default:/);          // semantic
  assert.match(css, /--hm-color-blue-600:/);            // primitive
  assert.match(css, /--hm-space-4:\s*16px/);            // dimension 객체 -> px
  assert.match(css, /--hm-font-weight-bold:\s*700/);
  assert.match(css, /--hm-typography-body-md:\s*400 16px\/1\.5/); // composite -> font 쇼트핸드
  assert.doesNotMatch(css, /\[object Object\]/);        // transform 누락 탐지
});

test('dark.css: [data-theme="dark"] 아래, dark 파일 토큰만', () => {
  const css = read('dark.css');
  assert.match(css, /\[data-theme="dark"\]\s*\{/);
  assert.match(css, /--hm-color-bg-default:/);
  assert.doesNotMatch(css, /--hm-color-blue-600:/);     // primitive 미포함
  assert.doesNotMatch(css, /--hm-color-border-focus:/); // 안 바뀌는 semantic 미포함
});

test('tokens.css: 인덱스가 두 파일을 @import', () => {
  const css = read('tokens.css');
  assert.match(css, /@import '\.\/light\.css';/);
  assert.match(css, /@import '\.\/dark\.css';/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — `ENOENT … dist/halfmoon/light.css` (dist가 아직 없음)

- [ ] **Step 3: build/build.mjs 작성**

```js
import StyleDictionary from 'style-dictionary';
import { writeFileSync } from 'node:fs';

const THEME = 'halfmoon';
const PRIMITIVES = 'src/primitive/*.tokens.json';
const LIGHT = `src/semantic/${THEME}/light.tokens.json`;
const DARK = `src/semantic/${THEME}/dark.tokens.json`;
const OUT = `dist/${THEME}/`;

// css transformGroup이 DTCG 객체를 전부 처리한다 (검증됨: dimension -> "16px",
// fontFamily 배열 -> 콤마 조인, typography composite -> font 쇼트핸드 문자열).
const light = new StyleDictionary({
  source: [PRIMITIVES, LIGHT],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'hm',
      buildPath: OUT,
      files: [{
        destination: 'light.css',
        format: 'css/variables',
        options: { selector: ':root' },
      }],
    },
  },
});

const dark = new StyleDictionary({
  // light 위에 dark를 덮어써 같은 이름을 재정의한다 — 충돌 경고는 의도된 것이라 침묵.
  // brokenReferences 등 에러 동작은 기본값 유지 (Global Constraints).
  source: [PRIMITIVES, LIGHT, DARK],
  log: { warnings: 'disabled' },
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'hm',
      buildPath: OUT,
      files: [{
        destination: 'dark.css',
        format: 'css/variables',
        options: { selector: '[data-theme="dark"]' },
        filter: (token) => token.filePath.endsWith('dark.tokens.json'),
      }],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();
writeFileSync(`${OUT}tokens.css`, "@import './light.css';\n@import './dark.css';\n");
console.log('build done:', OUT);
```

- [ ] **Step 4: 빌드 실행 후 테스트 통과 확인**

Run: `npm run check`
Expected: 빌드 성공 로그 + `test/css-output.test.mjs` 3개 테스트 PASS

참고 (문서로 사전 검증된 동작): css transformGroup은 DTCG dimension 객체를 `16px`로, fontFamily 배열을 콤마 조인 문자열로, typography composite를 `font` 쇼트핸드(`400 16px/1.5 'Pretendard Variable', …`)로 변환한다. `[object Object]`가 보인다면 transformGroup 오타부터 의심할 것.

- [ ] **Step 5: Commit** — dist/는 커밋 대상 (Global Constraints)

```bash
git add build test dist
git commit -m "feat: build CSS variables (light/dark) from DTCG source with Style Dictionary v5"
```

---

### Task 5: TypeScript 산출물 (커스텀 포맷)

**Files:**
- Create: `test/ts-output.test.mjs`
- Create: `build/formats.mjs`
- Modify: `build/build.mjs` (js 플랫폼 추가)

**Interfaces:**
- Consumes: Task 4의 light `StyleDictionary` 인스턴스 구조, Task 2·3의 토큰 경로
- Produces: `dist/halfmoon/tokens.js` — `export const tokens = {…}` (light 값; color는 hex 문자열, dimension은 단위 없는 숫자, fontFamily는 문자열 배열, typography는 `{fontFamily, fontSize, fontWeight, lineHeight}` 객체). `dist/halfmoon/tokens.d.ts` — 동일 트리의 리터럴 타입 `export declare const tokens: {…}`. `registerFormats()` 함수 (build.mjs가 호출).

ponytail: TS 객체는 light 값만 담는다 — 웹 소비는 CSS 변수가 담당하므로. 모드별 TS 객체는 RN 소비자가 생길 때 (스펙 Phase 3).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `test/ts-output.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tokens.js: light 값, 타입별 변환 규칙', async () => {
  const { tokens } = await import('../dist/halfmoon/tokens.js');
  assert.equal(tokens.color.bg.default, '#ffffff');            // color -> hex 문자열
  assert.equal(tokens.color.action.primary.bg, '#2563eb');     // 별칭 해석됨
  assert.equal(tokens.space['4'], 16);                         // dimension -> 단위 없는 숫자
  assert.equal(tokens.radius.md, 8);
  assert.equal(tokens.typography.body.md.fontSize, 16);        // composite 내부도 숫자
  assert.equal(tokens.typography.heading.lg.fontWeight, 700);
  assert.equal(tokens.typography.body.md.lineHeight, 1.5);
  assert.ok(Array.isArray(tokens.font.family.sans));           // fontFamily -> 배열
});

test('tokens.d.ts: 리터럴 타입 선언', () => {
  const dts = readFileSync('dist/halfmoon/tokens.d.ts', 'utf8');
  assert.match(dts, /export declare const tokens:/);
  assert.match(dts, /"default": "#ffffff"/);
  assert.match(dts, /"4": 16/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: `test/ts-output.test.mjs` FAIL — `Cannot find module … tokens.js`. (Task 4의 CSS 테스트는 PASS 유지)

- [ ] **Step 3: build/formats.mjs 작성**

```js
import StyleDictionary from 'style-dictionary';

// DTCG 값 -> JS 값. dimension은 단위를 버리고 숫자만 (스펙 §5).
function toJsValue(token) {
  const v = token.$value ?? token.value;
  const t = token.$type ?? token.type;
  switch (t) {
    case 'color':
      return typeof v === 'string' ? v : v.hex;
    case 'dimension':
      return typeof v === 'object' ? v.value : parseFloat(v);
    case 'typography':
      return {
        fontFamily: v.fontFamily,
        fontSize: typeof v.fontSize === 'object' ? v.fontSize.value : parseFloat(v.fontSize),
        fontWeight: v.fontWeight,
        lineHeight: v.lineHeight,
      };
    default:
      return v;
  }
}

function buildTree(allTokens) {
  const root = {};
  for (const token of allTokens) {
    let node = root;
    const path = token.path;
    for (let i = 0; i < path.length - 1; i++) node = node[path[i]] ??= {};
    node[path.at(-1)] = toJsValue(token);
  }
  return root;
}

// JSON.stringify 출력은 리터럴 값이자 유효한 TS 리터럴 타입 표기라 두 포맷이 빌더를 공유한다.
export function registerFormats() {
  StyleDictionary.registerFormat({
    name: 'javascript/literal',
    format: ({ dictionary }) =>
      `export const tokens = ${JSON.stringify(buildTree(dictionary.allTokens), null, 2)};\n`,
  });
  StyleDictionary.registerFormat({
    name: 'typescript/literal-declarations',
    format: ({ dictionary }) =>
      `export declare const tokens: ${JSON.stringify(buildTree(dictionary.allTokens), null, 2)};\n`,
  });
}
```

- [ ] **Step 4: build.mjs에 js 플랫폼 추가**

`build/build.mjs`의 import 아래에 등록 호출을 추가하고, light 인스턴스의 `platforms`에 `js`를 추가한다:

```js
import { registerFormats } from './formats.mjs';

registerFormats();
```

light 인스턴스의 `platforms.css` 아래에 추가 (transformGroup 없음 — 포맷이 원시 `$value`를 직접 변환):

```js
    js: {
      buildPath: OUT,
      files: [
        { destination: 'tokens.js', format: 'javascript/literal' },
        { destination: 'tokens.d.ts', format: 'typescript/literal-declarations' },
      ],
    },
```

- [ ] **Step 5: 통과 확인**

Run: `npm run check`
Expected: 전체 테스트 PASS (css-output 3개 + ts-output 2개)

- [ ] **Step 6: Commit**

```bash
git add build test dist
git commit -m "feat: emit typed JS token object (tokens.js + literal tokens.d.ts)"
```

---

### Task 6: 참조 무결성 게이트 테스트 (완료 기준 a)

**Files:**
- Create: `test/broken-reference.test.mjs`
- Create: `test/fixtures/broken.tokens.json`

**Interfaces:**
- Consumes: style-dictionary 패키지 (직접 import)
- Produces: "깨진 참조 → 빌드 실패"를 회귀 방지로 고정하는 테스트

- [ ] **Step 1: 픽스처 작성**

Create `test/fixtures/broken.tokens.json`:

```json
{
  "broken": {
    "$type": "color",
    "$value": "{does.not.exist}"
  }
}
```

- [ ] **Step 2: 테스트 작성** — 이 테스트는 처음부터 통과해야 한다 (SD 기본 동작의 회귀 방지 고정)

Create `test/broken-reference.test.mjs`:

```js
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
  await assert.rejects(() => sd.buildAllPlatforms());
});
```

- [ ] **Step 3: 통과 확인 + 부산물 없음 확인**

Run: `npm test && test ! -e test/fixtures/out && echo "no artifacts"`
Expected: 전체 PASS, `no artifacts` (throw가 파일 생성 전에 일어남. 만약 out/이 생기면 `.gitignore`에 `test/fixtures/out/` 추가)

- [ ] **Step 4: Commit**

```bash
git add test
git commit -m "test: pin broken-reference build failure as the integrity gate"
```

---

### Task 7: CI — 빌드 검증 + dist 신선도

**Files:**
- Create: `.github/workflows/tokens.yml`

**Interfaces:**
- Consumes: npm 스크립트 `build`/`test` (Task 1), 커밋된 dist/ (Task 4·5)
- Produces: PR·main push마다 참조 무결성(빌드)과 dist 신선도(`git diff --exit-code dist`)를 강제하는 워크플로우

- [ ] **Step 1: 워크플로우 작성**

```yaml
name: tokens
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      # dist/는 커밋 대상 — 소스와 어긋나면 실패 (스펙 §9)
      - run: git diff --exit-code dist
      - run: npm test
```

- [ ] **Step 2: 로컬에서 같은 시퀀스 검증**

Run: `npm ci && npm run build && git diff --exit-code dist && npm test && echo "CI sequence OK"`
Expected: `CI sequence OK`

- [ ] **Step 3: Commit**

```bash
git add .github
git commit -m "ci: build + dist freshness + tests on PR and main"
```

---

### Task 8: 가이드라인 문서

**Files:**
- Create: `docs/naming.md`
- Create: `docs/color.md`
- Create: `docs/spacing.md`
- Create: `docs/typography.md`

**Interfaces:**
- Consumes: Task 2·3의 토큰 경로와 값 (문서의 표는 토큰 파일과 일치해야 함)
- Produces: GitHub이 렌더링하는 사용 지침. Task 9의 레시피가 `naming.md`를 링크.

- [ ] **Step 1: naming.md 작성**

```markdown
# 토큰 네이밍 규칙

## 계층 (tier)

| tier | 위치 | 예 | 제품 코드에서 사용 |
|---|---|---|---|
| primitive | `src/primitive/` | `color.blue.600`, `space.4` | ❌ 금지 |
| semantic | `src/semantic/<theme>/` | `color.bg.default`, `color.action.primary.bg` | ✅ 이것만 |
| component | (Phase 1까지 없음) | — | — |

**규칙: 제품 코드는 semantic 토큰만 사용한다.** primitive를 직접 쓰면 모드·테마 전환이 깨진다.

## 별칭 방향

semantic → primitive 한 방향만. (`"$value": "{color.blue.600}"`)
primitive는 다른 토큰을 참조하지 않는다.

## 모드 (light / dark)

- `light.tokens.json`이 기준. `dark.tokens.json`은 **값이 바뀌는 토큰만** 같은 경로로 담는다.
- 다크에서 안 바뀌는 토큰(예: `color.border.focus`)은 dark 파일에 넣지 않는다.

## 산출물 이름

- CSS: `--hm-` + 경로의 kebab-case. `color.bg.default` → `--hm-color-bg-default`
- TS: 경로 그대로. `tokens.color.bg.default`

## 새 테마(프로젝트) 추가

`src/semantic/<새테마>/{light,dark}.tokens.json`을 추가하고 빌드에 테마를 등록한다.
semantic 경로 어휘(bg/fg/border/action/status)는 모든 테마가 동일해야 컴포넌트가 재사용된다.
```

- [ ] **Step 2: color.md 작성**

```markdown
# 색상

제품 코드는 semantic 역할만 사용한다 (`docs/naming.md` 참조).

## Semantic 역할

| 역할 | 용도 | light | dark |
|---|---|---|---|
| `color.bg.default` | 페이지 기본 배경 | white | gray.950 |
| `color.bg.subtle` | 섹션 구분 배경 | gray.50 | gray.900 |
| `color.bg.muted` | 비활성/입력 배경 | gray.100 | gray.800 |
| `color.bg.inverted` | 반전 배경 (툴팁 등) | gray.900 | gray.50 |
| `color.fg.default` | 본문 텍스트 | gray.900 | gray.50 |
| `color.fg.muted` | 보조 텍스트 | gray.600 | gray.400 |
| `color.fg.subtle` | 플레이스홀더/비활성 | gray.400 | gray.500 |
| `color.fg.inverted` | 반전 배경 위 텍스트 | white | gray.900 |
| `color.fg.link` | 링크 | blue.600 | blue.400 |
| `color.border.default` | 기본 테두리 | gray.200 | gray.800 |
| `color.border.strong` | 강조 테두리 | gray.300 | gray.700 |
| `color.border.focus` | 포커스 링 | blue.500 | (동일) |
| `color.action.primary.bg` | 주요 버튼 배경 | blue.600 | blue.500 |
| `color.action.primary.hover` | 주요 버튼 hover | blue.700 | blue.400 |
| `color.action.primary.fg` | 주요 버튼 텍스트 | white | (동일) |
| `color.status.danger` | 오류/파괴적 동작 | red.600 | red.500 |
| `color.status.success` | 성공 | green.600 | green.500 |
| `color.status.warning` | 경고 | amber.500 | amber.400 |

## Primitive 팔레트

gray(11단계) / blue(10단계) / red / green / amber + white/black.
값은 `src/primitive/color.tokens.json`이 단일 소스다 — 문서에 중복 기재하지 않는다.

## 새 역할 추가 기준

같은 용도가 두 곳 이상에서 필요해질 때 추가한다. 한 컴포넌트 전용 값은 Phase 1의
component tier 후보다.
```

- [ ] **Step 3: spacing.md 작성**

```markdown
# 간격 · 라운딩

## 간격 스케일 (`space.*`, 4px 기반)

| 토큰 | px | 용도 가이드 |
|---|---|---|
| `space.0` | 0 | 리셋 |
| `space.1` | 4 | 아이콘-텍스트 사이 |
| `space.2` | 8 | 밀접한 요소 사이 |
| `space.3` | 12 | 입력 내부 패딩 |
| `space.4` | 16 | 기본 패딩/갭 |
| `space.5` | 20 | — |
| `space.6` | 24 | 카드 내부 패딩 |
| `space.8` | 32 | 섹션 내 블록 사이 |
| `space.10` | 40 | — |
| `space.12` | 48 | 섹션 사이 |
| `space.16` | 64 | 페이지 레벨 여백 |

스케일 밖 값(예: 18px)이 필요해 보이면 대부분 설계 오류다 — 인접 스케일로 스냅한다.

## 라운딩 (`radius.*`)

| 토큰 | px | 용도 |
|---|---|---|
| `radius.sm` | 4 | 체크박스, 태그 |
| `radius.md` | 8 | 버튼, 입력 |
| `radius.lg` | 12 | 카드 |
| `radius.xl` | 16 | 모달, 시트 |
| `radius.full` | 9999 | pill, 아바타 |
```

- [ ] **Step 4: typography.md 작성**

```markdown
# 타이포그래피

## 텍스트 스타일 (`typography.*`)

| 스타일 | size | weight | lineHeight | 용도 |
|---|---|---|---|---|
| `typography.heading.lg` | 30 | 700 | 1.25 | 페이지 제목 |
| `typography.heading.md` | 24 | 600 | 1.25 | 섹션 제목 |
| `typography.heading.sm` | 20 | 600 | 1.25 | 카드/서브섹션 제목 |
| `typography.body.md` | 16 | 400 | 1.5 | 본문 기본 |
| `typography.body.sm` | 14 | 400 | 1.5 | 보조 본문, 테이블 |
| `typography.caption` | 12 | 400 | 1.5 | 라벨, 캡션 |

텍스트 스타일 composite는 두 형태로 제공된다:
- CSS: `font` 쇼트핸드 변수 — `font: var(--hm-typography-body-md);`
- TS: 객체 — `tokens.typography.body.md` (`{fontFamily, fontSize, fontWeight, lineHeight}`)

개별 속성이 필요하면 개별 변수를 쓴다: `font-size: var(--hm-size-font-md)` 등.

## 폰트

- `font.family.sans`: Pretendard 우선, 시스템 폰트 폴백. **폰트 로딩(웹폰트 포함)은 소비 앱 책임.**
- weight: 400 / 500 / 600 / 700 (`font.weight.*`)
- lineHeight: 1.25 (tight) / 1.5 (normal) / 1.625 (relaxed)
```

- [ ] **Step 5: 문서-토큰 일치 확인**

Run: `node -e "const t=JSON.parse(require('node:fs').readFileSync('src/primitive/dimension.tokens.json')); console.assert(t.space['4'].$value.value===16 && t.radius.md.$value.value===8 && t.size.font['3xl'].$value.value===30, 'MISMATCH'); console.log('docs match tokens')"`
Expected: `docs match tokens`

- [ ] **Step 6: Commit**

```bash
git add docs/naming.md docs/color.md docs/spacing.md docs/typography.md
git commit -m "docs: token usage guidelines (naming, color, spacing, typography)"
```

---

### Task 9: 웹 소비 레시피 + E2E 검증 (완료 기준 b, c)

**Files:**
- Create: `docs/consuming-web.md`
- (레포 밖) 세션 스크래치패드에 검증용 Vite 앱 — 커밋하지 않음

**Interfaces:**
- Consumes: Task 1의 exports 맵, Task 4·5의 dist 산출물
- Produces: 10분 도입 레시피 문서 + 레시피가 실제로 동작한다는 증거

- [ ] **Step 1: consuming-web.md 작성**

````markdown
# 웹에서 halfmoon 토큰 사용하기 (10분)

React/Vue/Astro 공통 — 토큰은 CSS 변수와 TS 객체라 프레임워크를 가리지 않는다.

## 1. 설치 (1분)

```bash
npm install github:playtag/halfmoon#v0.1.0
```

> org/레포명·태그는 실제 호스팅 위치를 따른다. dist가 커밋되어 있어 설치 후 빌드가 필요 없다.

## 2. 토큰 CSS 로드 (1분)

앱 진입점(예: `src/main.tsx`)에서:

```ts
import '@playtag/halfmoon-tokens/halfmoon/tokens.css';
```

라이트+다크 변수가 모두 로드된다.

## 3. 스타일에 사용 (5분)

CSS 어디서나 `--hm-` 변수를 쓴다. **semantic 역할만 사용할 것** (`naming.md` 참조):

```css
.card {
  background: var(--hm-color-bg-default);
  color: var(--hm-color-fg-default);
  border: 1px solid var(--hm-color-border-default);
  border-radius: var(--hm-radius-lg);
  padding: var(--hm-space-6);
}
.card button {
  background: var(--hm-color-action-primary-bg);
  color: var(--hm-color-action-primary-fg);
}
.card button:hover {
  background: var(--hm-color-action-primary-hover);
}
```

## 4. 다크 모드 (1분)

`<html>`에 `data-theme="dark"`를 붙이면 전체가 다크로 전환된다:

```ts
document.documentElement.dataset.theme = 'dark';   // 켜기
delete document.documentElement.dataset.theme;      // 라이트로
```

## 5. TS에서 값이 필요할 때 (선택)

CSS 변수를 못 쓰는 곳(캔버스, 차트 라이브러리 설정 등)에서만:

```ts
import { tokens } from '@playtag/halfmoon-tokens/halfmoon';

tokens.color.action.primary.bg; // '#2563eb' (light 값)
tokens.space['4'];              // 16 (숫자, px 단위 없음)
```

주의: TS 객체는 light 값 고정이다. 모드를 따라가야 하면 CSS 변수를 쓴다.
````

- [ ] **Step 2: 검증용 Vite 앱 생성 + 로컬 tarball 설치** — git URL 설치는 원격 리포가 있어야 하므로, 동일한 해석 경로(파일 목록·exports 맵)를 타는 `npm pack` tarball로 검증한다

Run (스크래치패드 디렉토리에서):

```bash
# 레포 밖 임시 디렉토리면 어디든 됨. 이 세션의 스크래치패드:
SCRATCHPAD=/private/tmp/claude-501/-Users-sanghyeon-projects-halfmoon-design/0b41865d-15b6-4f48-9e28-f001f7ed6cde/scratchpad
cd "$SCRATCHPAD"
npm create vite@latest hm-e2e -- --template react-ts
cd hm-e2e && npm install
TARBALL=$(npm pack /Users/sanghyeon/projects/halfmoon_design | tail -1)
npm install "./$TARBALL"
```

Expected: `playtag-halfmoon-tokens-0.0.0.tgz` 설치 성공

- [ ] **Step 3: 레시피 그대로 앱에 적용**

`src/main.tsx` 최상단에 추가:

```ts
import '@playtag/halfmoon-tokens/halfmoon/tokens.css';
```

`src/App.tsx` 전체 교체:

```tsx
import { tokens } from '@playtag/halfmoon-tokens/halfmoon';

export default function App() {
  const toggle = () => {
    const el = document.documentElement;
    if (el.dataset.theme === 'dark') delete el.dataset.theme;
    else el.dataset.theme = 'dark';
  };
  return (
    <div style={{
      background: 'var(--hm-color-bg-default)',
      color: 'var(--hm-color-fg-default)',
      border: '1px solid var(--hm-color-border-default)',
      borderRadius: 'var(--hm-radius-lg)',
      padding: 'var(--hm-space-6)',
    }}>
      <h1>halfmoon E2E</h1>
      <p>primary(light) from TS: {tokens.color.action.primary.bg}</p>
      <button onClick={toggle} style={{
        background: 'var(--hm-color-action-primary-bg)',
        color: 'var(--hm-color-action-primary-fg)',
      }}>
        toggle theme
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 빌드 성공 + 산출물에 토큰 존재 확인**

Run: `npm run build && grep -l -- --hm-color-bg-default dist/assets/*.css && grep -l 'data-theme="dark"' dist/assets/*.css && grep -rl '#2563eb' dist/assets/*.js && echo "E2E OK"`
Expected: `E2E OK` — exports 해석·CSS 로드·TS import·다크 블록 포함이 모두 증명됨

- [ ] **Step 5: 런타임 확인** — `run`/`verify` 스킬이 있으면 그것으로 브라우저 확인(버튼 클릭 시 배경 전환)을 수행하고, 없으면 Step 4의 정적 증거로 갈음한다고 명시적으로 보고할 것

- [ ] **Step 6: 검증 앱 삭제 + 레시피 커밋**

```bash
rm -rf "$SCRATCHPAD/hm-e2e"
cd /Users/sanghyeon/projects/halfmoon_design
git add docs/consuming-web.md
git commit -m "docs: 10-minute web consumption recipe (verified end-to-end)"
```

---

### Task 10: v0.1.0 릴리스

**Files:**
- Modify: `package.json` (version — `npm version`이 수정)

**Interfaces:**
- Consumes: 전체 이전 태스크 (working tree가 clean하고 check가 통과해야 함)
- Produces: `v0.1.0` git 태그 — 소비자가 `github:…#v0.1.0`으로 설치하는 대상

- [ ] **Step 1: 최종 검증**

Run: `npm run check && git status --porcelain`
Expected: 전체 PASS + 출력 없음(clean tree). dist 변경이 남아 있으면 `git add dist && git commit -m "chore: rebuild dist"` 후 재실행.

- [ ] **Step 2: 버전 + 태그**

Run: `npm version 0.1.0`
Expected: package.json이 0.1.0으로 변경된 커밋 `v0.1.0`과 git 태그 `v0.1.0` 생성 (npm version은 clean tree에서 커밋+태그를 자동 생성)

- [ ] **Step 3: 태그 확인**

Run: `git tag -l && git log --oneline -3`
Expected: `v0.1.0` 태그 존재, 최신 커밋이 버전 커밋

- [ ] **Step 4: 남은 일 보고** — 원격 리포가 아직 없다. 사용자에게 GitHub 리포 생성·push(`git push -u origin main --tags`)를 안내하고 Phase 0 완료를 보고한다.
