# 웹에서 halfmoon 사용하기 (10분)

토큰은 CSS 변수·TS 객체라 프레임워크를 가리지 않는다. React 컴포넌트는 Tailwind v4 프로젝트에서 사용한다.

> 요구사항: **pnpm ≥ 11.7** (git 서브디렉토리 설치의 lockfile 버그가 11.7에서 수정됨). npm/yarn은 지원하지 않는다.

## A. 토큰만 쓰기 (모든 웹 프레임워크)

### 1. 설치 (1분)

```bash
pnpm add "github:halfmoon-mind/halfmoon-design#tokens-v0.2.0&path:packages/tokens"
```

> `&`는 셸 메타문자 — 반드시 따옴표로 감싼다. dist가 커밋되어 있어 설치 후 빌드가 없다.

### 2. 토큰 CSS 로드 (1분)

앱 진입점(예: `src/main.tsx`)에서:

```ts
import '@halfmoon/tokens/halfmoon/tokens.css';
```

### 3. 스타일에 사용 (5분)

CSS 어디서나 `--hm-` 변수를 쓴다. **semantic 역할만 사용할 것** (`naming.md` 참조):

```css
.card {
  background: var(--hm-color-bg-default);
  color: var(--hm-color-fg-default);
  border: 1px solid var(--hm-color-border-default);
  border-radius: var(--hm-radius-lg);
  padding: var(--hm-space-6);
}
```

### 4. 다크 모드 (1분)

`<html>`에 `data-theme="dark"`를 붙이면 전체가 다크로 전환된다:

```ts
document.documentElement.dataset.theme = 'dark';   // 켜기
delete document.documentElement.dataset.theme;      // 라이트로
```

### 5. TS에서 값이 필요할 때 (선택)

```ts
import { tokens } from '@halfmoon/tokens/halfmoon';

tokens.color.action.primary.bg; // '#2563eb' (light 값 고정)
tokens.space['4'];              // 16 (숫자, px 없음)
```

## B. React 컴포넌트 쓰기 (Vite + React 19 + Tailwind v4)

### 1. 설치 (2분)

```bash
pnpm add tailwindcss @tailwindcss/vite tw-animate-css
pnpm add "github:halfmoon-mind/halfmoon-design#tokens-v0.2.0&path:packages/tokens"
pnpm add "github:halfmoon-mind/halfmoon-design#react-v0.1.1&path:packages/react"
```

`vite.config.ts`에 Tailwind 플러그인:

```ts
import tailwindcss from '@tailwindcss/vite';
// plugins: [react(), tailwindcss()]
```

### 2. CSS 엔트리 구성 (2분)

`src/index.css` 전체를 다음으로 교체:

```css
@import "tailwindcss";
@import "tw-animate-css";                         /* 컴포넌트 애니메이션 */
@import "@halfmoon/tokens/halfmoon/tokens.css";   /* --hm-* 변수 (light/dark) */
@import "@halfmoon/tokens/halfmoon/tailwind.css"; /* Tailwind @theme 매핑 */
@import "@halfmoon/react/theme.css";              /* shadcn 변수 브리지 */
@source "../node_modules/@halfmoon/react";
```

> **`@source` 줄을 빼먹으면 컴포넌트가 스타일 없이 렌더된다** — Tailwind v4는 node_modules를 자동 스캔하지 않는다.

### 3. 사용 (3분)

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@halfmoon/react';

export default function App() {
  return (
    <Card className="m-8 w-96">
      <CardHeader><CardTitle>halfmoon</CardTitle></CardHeader>
      <CardContent><Button>시작하기</Button></CardContent>
    </Card>
  );
}
```

다크 모드는 토큰과 동일 — `data-theme="dark"` 하나로 컴포넌트까지 전부 전환된다.
