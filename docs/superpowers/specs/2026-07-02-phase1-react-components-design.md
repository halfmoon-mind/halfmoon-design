# Halfmoon Phase 1 — React 컴포넌트 설계 스펙

- 날짜: 2026-07-02
- 상태: 설계 확정 (사용자 승인), 구현 계획 수립 전
- 상위 문서: `2026-07-02-halfmoon-design-system-design.md` §10 Phase 1
- 근거: pnpm git 서브디렉토리 설치·Tailwind v4 `@theme`/`@source`·shadcn 현행 변수 계약·Storybook 10·React 라이브러리 빌드 도구를 공식 문서 기준으로 병렬 검증 완료 (2026-07-02)

## 1. 확정된 결정

| 결정 | 내용 |
|---|---|
| 소비 제품 | 아직 없음 — **기반 먼저** 구축, 컴포넌트는 범용 최소셋 |
| 배포 형태 | **npm 패키지** (copy-in 레지스트리 아님). 단 퍼블리시 레지스트리는 보류 |
| 패키지 이름 | 조직/이름 미정 (playtag 소속 아님) → **임시 스코프 `@halfmoon/*`**, 이름 확정 시 일괄 치환 1회 (현재 소비자 0이라 지금이 rename 최저 비용) |
| 패키지 매니저 | **pnpm** (npm 사용 안 함 — lockfile·CI·문서 전부 pnpm) |
| Changesets + GitHub Packages | **이름 확정 시점으로 이연** — GitHub Packages는 스코프가 저장소 owner와 일치해야 하므로 지금 도입하면 두 번 일함. 소비자 0이라 버전 자동화 수혜자도 없음 |
| Turborepo | 도입 안 함 (패키지 2개, `pnpm -r`로 충분) |

## 2. 레포 구조 — pnpm 모노레포

```
halfmoon_design/
├── pnpm-workspace.yaml
├── package.json                  # private 루트: 공통 스크립트만 (pnpm -r 팬아웃)
├── packages/
│   ├── tokens/                   # 현 루트 패키지 이동 + @halfmoon/tokens rename
│   │   ├── src/ build/ dist/ test/    # 기존 그대로 (§3의 @theme 출력만 추가)
│   │   └── package.json
│   └── react/                    # 신설: @halfmoon/react
│       ├── src/
│       │   ├── components/ui/    # shadcn copy-in (new-york 스타일)
│       │   ├── lib/utils.ts      # cn() — 패키지에 포함 (shadcn은 cn을 npm 배포하지 않음)
│       │   ├── styles/theme.css  # shadcn 변수 → hm 토큰 브리지 (§4)
│       │   └── index.ts          # 공개 export
│       ├── .storybook/           # Storybook 10 워크벤치 (§6)
│       ├── vite.config.ts        # @tailwindcss/vite — Storybook이 자동 병합
│       ├── dist/                 # 커밋함 (tokens와 동일 패턴, §7)
│       └── package.json
├── docs/                         # 루트 유지, consuming-web.md 개정 (§7)
└── .github/workflows/tokens.yml  # pnpm 전환 + react 빌드/테스트/dist freshness 추가
```

- `package-lock.json` 삭제. 루트 `packageManager` 필드로 pnpm 버전 고정.
- Phase 0의 "tokens 패키지 = 레포 루트" 제약은 npm git 의존성 한계 때문이었음 — 소비자가 pnpm이므로 서브디렉토리 설치가 가능해져(§7) 모노레포 전환의 소비자 비용이 사라짐.

## 3. packages/tokens — 변경 2가지만

1. **rename**: `@playtag/halfmoon-tokens` → `@halfmoon/tokens`.
2. **Tailwind v4 `@theme` 출력 추가**: `dist/halfmoon/tailwind.css` — SD 커스텀 포맷 1개로 토큰을 Tailwind 네임스페이스에 매핑. (react 브리지의 `theme.css`와 이름이 겹치지 않도록 `tailwind.css`로 명명.)
   - 네임스페이스 대응 (Tailwind 공식 표 검증): color → `--color-*`, space → `--spacing-*`, radius → `--radius-*`, fontFamily → `--font-*`, fontSize → `--text-*`, fontWeight → `--font-weight-*`.
   - **방출 범위**: 색상은 **semantic만** (primitive 색상을 유틸리티로 노출하면 "제품 코드의 primitive 직접 참조 금지" 원칙이 유틸리티 형태로 우회됨). dimension·typography 스케일은 semantic 층이 없으므로 primitive를 방출한다 — 디자인 스케일 자체가 공유 어휘.
   - hm space 스케일(4px 기반)은 Tailwind v4 기본 스케일(`--spacing: 0.25rem` 배수)과 값이 일치한다. 정확한 방출 집합(숫자 spacing을 명시 방출할지 배수에 맡길지)은 구현 계획에서 확정.
   - 값이 `var(--hm-*)`를 참조하므로 **`@theme inline` 블록 필수** (inline 없이는 유틸리티가 var 해석을 잘못할 수 있음 — Tailwind 문서 명시).
   - **radius는 이 파일이 단독 소유**: `--radius-sm/md/lg/xl/full` → `var(--hm-radius-*)`. react 브리지는 radius를 재정의하지 않는다 (§4.1).
   - 상위 스펙 §5 결정 유지: `@theme` 출력은 `hm` 접두사 없이 Tailwind 네임스페이스로(유틸리티 생성 유지), `--hm-*`는 tokens.css 전용. 두 산출물 모두 같은 소스에서 생성되므로 drift 없음.
3. 그 외 기존 토큰 소스·빌드·테스트는 손대지 않음.

## 4. packages/react — 테마 브리지 + shadcn copy-in

### 4.1 브리지 (`src/styles/theme.css`) — 이 설계의 핵심

shadcn 컴포넌트 코드는 **수정하지 않는다**. 대신 shadcn이 기대하는 변수 계약을 hm semantic 토큰의 별칭으로 정의한다:

```css
@custom-variant dark (&:is([data-theme=dark] *));   /* hm의 data-theme 방식과 정합 */

:root {
  --background: var(--hm-color-bg-default);
  --foreground: var(--hm-color-fg-default);
  --card: var(--hm-color-bg-default);          /* +card-foreground */
  --popover: var(--hm-color-bg-default);       /* +popover-foreground */
  --primary: var(--hm-color-action-primary-bg);
  --primary-foreground: var(--hm-color-action-primary-fg);
  --secondary: var(--hm-color-bg-muted);       /* +secondary-foreground */
  --muted: var(--hm-color-bg-muted);
  --muted-foreground: var(--hm-color-fg-muted);
  --accent: var(--hm-color-bg-muted);          /* +accent-foreground */
  --destructive: var(--hm-color-status-danger);
  --border: var(--hm-color-border-default);
  --input: var(--hm-color-border-default);
  --ring: var(--hm-color-border-focus);
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* … shadcn 표준 @theme inline 색상 매핑 전체 (ui.shadcn.com/docs/theming 계약 그대로) */
}
```

- **다크 블록 불필요**: hm 토큰이 `[data-theme="dark"]`에서 스스로 바뀌므로 별칭이 자동 추종. shadcn 표준의 `.dark { … }` 재정의 블록이 통째로 사라짐 — 브리지 방식의 가장 큰 이점.
- **radius는 브리지가 정의하지 않는다**: shadcn 관례는 단일 `--radius`에서 `calc(var(--radius) ± n px)`로 sm~xl을 파생하지만, 그대로 쓰면 tokens의 `tailwind.css`가 방출하는 `--radius-*`와 이중 정의로 충돌한다. 컴포넌트의 `rounded-md/lg/…` 유틸리티는 hm radius 스케일(§3)로 해석된다 — 값이 shadcn 기본과 다른 것은 우리 디자인 시스템의 look이므로 의도된 것. 시작 셋 13개가 참조하는 `rounded-*` 단계가 hm 스케일(sm/md/lg/xl/full)로 전부 커버되는지 Storybook에서 컴포넌트별 확인.
- **어휘 갭 처리**: `secondary`/`accent`는 우선 기존 semantic 토큰으로 매핑. 실제로 구분된 look이 필요해질 때 **component tier 토큰**을 추가한다 (상위 스펙 §4.2 "필요할 때까지 빈 채로" 원칙). chart-\*·sidebar-\*는 해당 컴포넌트를 큐레이션하지 않으므로 정의하지 않는다.

### 4.2 컴포넌트 시작 셋 (13)

Button, Badge, Card, Input, Label, Textarea, Select, Checkbox, Switch, Dialog, DropdownMenu, Tabs, Tooltip.

- shadcn 현행 관례: **new-york 스타일** (default 스타일은 deprecated), **통합 `radix-ui` 패키지** (2026-02부터 개별 `@radix-ui/react-*` 대체, 혼용 시 Radix 중복 설치 위험).
- 런타임 의존성이 `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`로 닫힘 (sonner·recharts 등 무거운 per-component 의존성 없음).
- CSS 측 의존성 **`tw-animate-css`**: Dialog·DropdownMenu·Select·Tooltip 등의 `animate-in/out` 계열 클래스가 여기서 나옴. 소비자가 직접 설치·import한다 (§7 레시피에 포함 — pnpm 엄격 node_modules에서 중첩 해석에 걸지 않기 위해 명시적으로).
- 브리지 완성 후 컴포넌트 추가는 한계비용이 낮으므로 목록 확장은 수요 발생 시.

### 4.3 빌드 — tsdown, unbundle

- **tsdown + `unbundle: true`** — tsup은 공식 유지보수 종료("consider using tsdown instead"), tsdown이 지정 후속 (Rolldown 기반, tsup 옵션 호환).
- 파일별 ESM 출력: `"use client"` 지시어 자연 보존 (번들 병합 시 소실됨이 확인된 함정), tree-shaking은 소비자 번들러에 위임. `.d.ts` 자동 생성.
- `package.json`: `peerDependencies: { react: "^19.0.0", react-dom: "^19.0.0" }` (그린필드 — React 18 지원은 요청 시), `sideEffects: ["**/*.css"]` (CSS import 보존), exports 맵은 **types 조건 최우선** (틀리면 TS가 타입을 잘못/못 찾음). ESM-only.
- 패키지 형상 검증: tsdown 내장 publint/attw 린트 사용.

## 5. component 토큰 tier

상위 스펙 §4.2대로 **필요가 실증될 때만** 채운다. Phase 1에서 예상되는 첫 후보: `secondary`/`accent`가 `bg.muted` 매핑으로 부족해지는 시점. 브리지에 하드코딩하지 않고 `src/component/` tier에 DTCG로 추가 → 빌드 산출물 경유.

## 6. Storybook 10 워크벤치

- `packages/react` 안에서 `pnpm create storybook@latest` (react-vite 프레임워크 자동 감지). Storybook 10은 ESM-only.
- Tailwind: `@tailwindcss/vite`를 패키지 `vite.config.ts`에만 둔다 — Storybook Vite 빌더가 프로젝트 vite config를 자동 병합하므로 `viteFinal` 중복 설정 금지 (이중 처리 함정 확인됨). preview에서 Tailwind 엔트리 CSS 로드 (§7 레시피와 동일 import 구성; 단 컴포넌트 소스가 패키지 안에 있으므로 `@source` 불필요, workspace 내부라 tokens는 상대/workspace 참조).
- 다크 토글: 공식 `@storybook/addon-themes`의 `withThemeByDataAttribute({ attributeName: 'data-theme', themes: { light, dark } })` — 툴바 스위처가 `data-theme`을 전환, hm 다크 토큰·브리지와 그대로 정합.
- 컴포넌트당 스토리 1개 이상. 퍼블리시하지 않음 (컴포넌트 워크벤치, 상위 스펙 §8).

## 7. 배포·소비

- **git 태그 + pnpm 서브디렉토리 설치** (pnpm ≥9 문법; `&`는 셸 메타문자라 따옴표 필수):

  ```sh
  pnpm add "github:halfmoon-mind/halfmoon_design#tokens-v0.2.0&path:packages/tokens"
  pnpm add "github:halfmoon-mind/halfmoon_design#react-v0.1.0&path:packages/react"
  ```

  - **소비자 pnpm ≥11.7 권장** — 그 미만은 lockfile에서 `path:`가 유실돼 재설치 시 레포 루트가 풀리는 버그 확인됨 (pnpm 11.7에서 수정).
- 태그는 패키지별: `tokens-v*`, `react-v*`. 버저닝은 수동 `pnpm version` + 태그 (Changesets 이연, §1).
- **dist/ 커밋은 이제 필수 전제** — pnpm 10+가 git 의존성의 prepare/빌드 스크립트를 기본 차단 (보안 강화, CVE-2025-69264 관련 추가 강화 확인). 설치 시 빌드가 절대 돌지 않는다는 전제로 `files`/`exports`가 dist/를 가리켜야 함. 릴리스 플로우는 Phase 0과 동일: `build → dist/ 커밋 → version → tag`.
- **소비 레시피 개정** (`docs/consuming-web.md`): Tailwind v4 소비자 기준 — 두 패키지 + `tw-animate-css` 설치 후:

  ```css
  @import "tailwindcss";
  @import "tw-animate-css";                         /* shadcn 컴포넌트 애니메이션 */
  @import "@halfmoon/tokens/halfmoon/tokens.css";   /* --hm-* 변수 (light/dark) */
  @import "@halfmoon/tokens/halfmoon/tailwind.css"; /* Tailwind @theme 매핑 */
  @import "@halfmoon/react/theme.css";              /* shadcn 변수 브리지 */
  @source "../node_modules/@halfmoon/react";
  ```

  halfmoon 관련 import 3줄을 소비자 CSS에 전부 명시하는 이유: 패키지 CSS 안에서 다른 패키지를 `@import`하는 중첩 해석은 pnpm의 엄격한 node_modules 구조에서 보장을 확인하지 못했음 — 명시가 확실하고 디버깅 가능. `@source`가 빠지면 스타일이 조용히 사라진다 — Tailwind v4가 node_modules를 자동 스캔에서 제외하기 때문 (컴파일 배포의 1순위 함정). 레시피에 명시하고 완료 기준 (d)로 커버.
- 토큰만 쓰는 비-Tailwind 소비자는 Phase 0 경로(tokens.css) 그대로 유효.

## 8. CI

`.github/workflows/tokens.yml` 개정: pnpm 셋업(`pnpm/action-setup`) →

1. tokens: 빌드(=참조 무결성 게이트) + 테스트 + dist freshness (기존 게이트 유지)
2. react: tsdown 빌드 + dist freshness + (있다면) 테스트

Storybook 빌드는 CI에 넣지 않는다 (워크벤치 — 로컬 개발 도구, 게이트 아님).

## 9. 완료 기준

- (a) 기존 토큰 게이트(깨진 참조 = 빌드 실패)와 dist freshness가 모노레포에서 그대로 동작한다
- (b) `@theme` 출력 스모크 테스트: Tailwind 유틸리티가 hm 토큰 값으로 생성된다
- (c) Storybook에서 13개 컴포넌트가 halfmoon light/dark로 렌더되고 툴바 `data-theme` 토글이 동작한다
- (d) 새 Vite React 앱이 git 의존성 2개로 테마 적용된 shadcn 컴포넌트를 렌더한다 (개정 레시피 그대로 따라 10분 안에)

## 10. 상위 스펙 §10 대비 달라지는 점 (명시적 편차)

1. **Changesets + GitHub Packages 이연** — 이름 미정 + 소비자 0 (§1)
2. **스코프 임시 rename** `@playtag/*` → `@halfmoon/*`
3. **Turborepo 미도입** — 패키지 2개엔 과잉
4. 이연 항목들의 도입 트리거: 패키지 이름/조직 확정 (그때 Changesets + 레지스트리 승격 + 스코프 최종 rename을 한 번에)

## 11. 정직한 비용·리스크

- **shadcn 어휘 ≠ hm 어휘**: 브리지가 흡수하지만, `secondary`/`accent`를 `bg.muted`로 접는 매핑은 시각적 구분이 없다. 구분이 필요해지면 component tier 추가 비용 발생 (§5에 경로 확보).
- **컴포넌트 업그레이드는 수동**: copy-in이므로 shadcn 업스트림 수정은 재-add로 가져온다. 컴포넌트 코드를 무수정 유지하는 브리지 방식이 이 비용을 최소화.
- **임시 스코프**: 이름 확정 전 소비자가 생기면 그 소비자는 rename 시 의존성 소스를 1회 변경해야 한다.
- **pnpm 전제**: 서브디렉토리 git 설치는 pnpm 전용 — npm/yarn 소비자는 이름 확정 후 레지스트리 승격 전까지 지원하지 않는다 (의도된 제약).
