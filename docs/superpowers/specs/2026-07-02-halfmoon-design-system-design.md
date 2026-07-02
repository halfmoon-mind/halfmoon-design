# Halfmoon 디자인 시스템 — 기반 설계 스펙

- 날짜: 2026-07-02
- 상태: 설계 확정 (사용자 답변 반영), 구현 계획 수립 전
- 근거: 2026년 중반 기준 DTCG 스펙·토큰 빌드 도구·플랫폼별 소비 패턴·레퍼런스 아키텍처(Primer, Polaris, Spectrum, SLDS, Nord) 리서치 및 3개 접근안 비교 심사

## 1. 목적

여러 프로젝트(웹 우선, 이후 Flutter/RN 등)에서 **빠르게 일관된 UI를 구현**하기 위한 단일 기반. 공유하는 것은 컴포넌트 코드가 아니라 **디자인 토큰 + 가이드라인**이며, 컴포넌트는 플랫폼별로 토큰을 소비해 만든다.

## 2. 확정된 결정

| 결정 | 내용 |
|---|---|
| 첫 플랫폼 | **웹 (React)**. 토큰 레벨은 CSS 변수로 Vue/Astro도 동시 커버. |
| 멀티 프로젝트 | **지원.** semantic 층에 테마(프로젝트) 차원을 처음부터 구조화. |
| 토큰 저작 | **개발자 손저작 DTCG JSON.** Figma/Tokens Studio 연동 없음. |
| 범위 | 디자인 토큰 + 컴포넌트 라이브러리 + 가이드라인 문서. |

## 3. 비범위 (명시적으로 안 하는 것)

- 크로스 플랫폼 공용 컴포넌트 런타임 (Flutter/RN/React는 런타임을 공유할 수 없음 — 시도하지 않는다)
- Figma 동기화
- Phase 0에서의 Flutter/RN/iOS/Android 출력 (소스가 표준 DTCG이므로 소비자가 생기면 Style Dictionary 설정 추가로 해결)
- 문서 사이트, Storybook, 릴리스 자동화 도구 — 각각 실제 필요(첫 컴포넌트 라이브러리, 두 번째 패키지, 외부 독자)가 생길 때 추가

## 4. 토큰 아키텍처

### 4.1 포맷

- **W3C DTCG 2025.10** (2025-10-28 안정판) `*.tokens.json`, `$value`/`$type`/`$description`.
- **color**: 구조화 객체 + hex 폴백: `{"colorSpace":"srgb","components":[...],"alpha":1,"hex":"#3366e6"}`. oklch/P3는 실제 필요 전까지 보류.
- **dimension**: `{"value":16,"unit":"px"}` 객체 형식 (구식 문자열 `"16px"` 금지).
- **typography**: 복합(composite) 타입 유지, 프리미티브로 풀어 쓰지 않음.
- DTCG **Resolver 모듈은 draft이므로 사용 금지.** 모드 조합은 Style Dictionary의 멀티 파일 관례로 처리. 소스가 순수 DTCG라서 Resolver가 안정화되면 빌드 설정 변경만으로 이행 가능.

### 4.2 계층 (3-tier, 초기엔 2개만 채움)

1. **primitive** — 브랜드·모드 무관 원시 스케일 (`color.blue.500`, `space.4`). 제품 코드가 직접 참조 금지.
2. **semantic** — 역할 별칭 (`color.bg.default` → `{color.blue.500}`). **모드(라이트/다크)와 테마(프로젝트)가 바뀌는 유일한 층.**
3. **component** — 첫 컴포넌트 라이브러리가 semantic 어휘에 넣으면 안 되는 값을 필요로 할 때까지 **빈 채로 유지.**

### 4.3 테마(멀티 프로젝트) 구조

- semantic 층은 처음부터 테마 차원을 가진다: `semantic/halfmoon/{light,dark}.tokens.json` (halfmoon = 기본 테마).
- 새 프로젝트가 자기 look이 필요하면 `semantic/<프로젝트>/{light,dark}.tokens.json` (+ 필요 시 프리미티브 팔레트 파일)을 **추가**한다. 리팩토링 없음.
- 컴포넌트는 semantic 변수만 참조하므로, 같은 컴포넌트가 테마 CSS 교체만으로 프로젝트별 look을 갖는다.
- 라이트+다크는 **Phase 0부터 실제 출시** — semantic 층이 진짜 교체 지점임을 증명하는 가장 싼 방법.

### 4.4 네임스페이스

- 접두사 `hm` → CSS 변수 `--hm-color-bg-default`.

## 5. 빌드 파이프라인

- **Style Dictionary v5** (버전 고정). 선정 이유: 웹·Flutter·RN·iOS·Android 출력을 전부 내장/표준 패턴으로 지원하는 유일한 OSS 토큰 컴파일러. Terrazzo는 웹+iOS 중심이라 탈락. 소스가 DTCG라 도구 교체가 함정이 되지 않음.
- 하나의 빌드 스크립트(`build/build.mjs` — light/dark 두 SD 인스턴스 + 커스텀 포맷 등록)에서 테마별 출력 (Phase 0):
  - **CSS**: `dist/<theme>/light.css`(`:root`) + `dist/<theme>/dark.css`(`[data-theme="dark"]`) — 내장 `css/variables` 포맷을 selector 옵션으로 2회 호출, 커스텀 포맷 0. 정적 `tokens.css`가 두 파일을 `@import`.
  - **TypeScript**: `dist/<theme>/tokens.ts(.d.ts)` — `as const` 객체. dimension은 단위 없는 숫자(px 제거 transform), 색은 문자열, 타이포는 객체. 내장 포맷이 `as const`를 지원하지 않으므로 **소형 커스텀 포맷 1개**(수십 줄) 필요 — Phase 0 견적에 포함.
  - **Tailwind v4 `@theme`**: **Phase 1로 이연** (shadcn/ui와 함께 도입). 결정 사항 선기록: Tailwind v4는 자기 네임스페이스(`--color-*`, `--spacing-*` 등)에서만 유틸리티를 생성하므로, `@theme` 출력은 `hm` 접두사 없이 Tailwind 네임스페이스로 매핑한다(유틸리티 생성 유지). `--hm-` 접두사는 `tokens.css`(비-Tailwind 소비자용) 전용. 두 산출물 모두 같은 소스에서 생성되므로 drift 없음.
- **검증 = 빌드.** `style-dictionary build`가 깨진 참조·순환 참조에서 실패하는 것이 Phase 0의 유일한 검증 게이트. 커스텀 스키마 검증기는 만들지 않는다.
  - 게이트의 범위는 **참조 무결성뿐**이다 — transform 누락 등 출력 오류는 잡지 못하며, 이는 완료 기준 (b)의 10분 레시피가 스모크 테스트로 커버한다. `brokenReferences`를 기본값(throw)에서 낮추지 않는 것이 전제.

## 6. 레포 구조

독립 레포 (소비 프로젝트들과 분리). **Phase 0에서는 tokens 패키지가 곧 레포 루트다** — npm/pnpm/yarn 어느 것으로든 `github:` git 의존성이 추가 문법 없이 동작해야 하기 때문 (npm의 git 의존성은 레포 루트 package.json만 설치 가능; 서브디렉토리 설치는 pnpm 전용 문법이거나 너무 최신). 모노레포 재구성은 두 번째 패키지가 생기는 Phase 1에.

```
halfmoon/                            # 레포 루트 = @playtag/halfmoon-tokens 패키지
├── src/
│   ├── primitive/
│   │   ├── color.tokens.json
│   │   ├── dimension.tokens.json
│   │   └── typography.tokens.json
│   └── semantic/
│       └── halfmoon/
│           ├── light.tokens.json
│           └── dark.tokens.json     # 바뀌는 토큰만
├── build/                           # build.mjs + formats.mjs (커스텀 TS 포맷)
├── package.json                     # exports 맵: ./css ./ts (테마별)
├── dist/                            # 생성물 — 릴리스 태그 커밋에 포함 (§9)
├── docs/                            # Phase 0: GitHub 렌더링 마크다운만
│   ├── naming.md  color.md  spacing.md  typography.md
│   └── consuming-web.md             # 10분 도입 레시피
├── .github/workflows/tokens.yml     # PR: 빌드(=참조 무결성)
└── README.md
```

- **Phase 1에서** `packages/tokens/` + `packages/react/` 모노레포로 재구성 (pnpm-workspace, Changesets 도입과 동시). 이때 소비자는 의존성 소스를 1회 변경하는데, 같은 시점에 예정된 GitHub Packages 전환과 함께 지불하는 비용이라 추가 부담이 아니다.
- `flutter/` 등은 해당 Phase에 추가.

## 7. 컴포넌트 전략 — "검증된 프리미티브를 테마링, 처음부터 만들지 않는다"

- **React (Phase 1)**: **shadcn/ui** (Radix 기반, a11y 확보)를 halfmoon 토큰(`@theme`/CSS 변수)으로 테마링 + **Storybook**. 배포 방식(커스텀 shadcn 레지스트리로 copy-in vs npm 패키지)은 Phase 1 시작 시점에 결정 — 여러 내부 프로젝트에 수정 전파가 중요하면 패키지, 프로젝트별 커스터마이즈가 중요하면 레지스트리.
- **Vue/Astro**: 토큰(CSS 변수·`@theme`)은 즉시 사용 가능. Astro는 React 아일랜드로 컴포넌트 재사용 가능. Vue 전용 컴포넌트는 실제 Vue 프로젝트가 생기면.
- **Flutter (미래)**: 내장 `flutter/class.dart` 포맷으로 플랫 상수 자동 생성 + **손으로 쓴 얇은 `HalfmoonTheme`** (`ColorScheme`/`TextTheme` 매핑 + `ThemeExtension`(올바른 `lerp`/`copyWith` 포함)). 커스텀 Dart 코드젠 포맷은 만들지 않는다 (SD/Flutter 업그레이드 시 가장 깨지기 쉬운 부분이라는 리서치 결론).
- **React Native (미래)**: TS 토큰 객체를 `react-native-unistyles` 테마로 소비 (기본 추천), NativeWind로 교체 가능.

## 8. 문서 전략

- **Phase 0**: `docs/` 마크다운 — 네이밍 규칙, 색/간격/타이포 사용법, 웹 도입 레시피. 인프라 0.
- **Phase 1**: Storybook (컴포넌트 워크벤치로서, 별도 문서 프로젝트 아님).
- **Phase 2**: 독자가 코어 개발자를 넘어설 때 Astro Starlight 사이트 + 토큰 JSON에서 자동 생성되는 토큰 레퍼런스 페이지.

## 9. 배포·버저닝

- **시작: git 태그 의존성** (예: `npm install github:playtag/halfmoon#v0.1.0` — 실제 org/레포명은 호스팅 위치를 따름) — 레지스트리 인프라 0. tokens 패키지가 레포 루트이므로(§6) 이 명령이 어떤 패키지 매니저에서든 그대로 동작한다.
- **dist/는 릴리스 태그 커밋에 포함한다** (git 설치 시 빌드 없이 소비 가능하도록). `prepare` 스크립트로 설치 시 빌드하는 방식은 쓰지 않는다 — pnpm 10.26+가 git 의존성의 lifecycle 스크립트를 기본 차단한다. 릴리스 플로우: `build → dist/ 커밋 → npm version → git tag`.
- 버전: 수동 `npm version` + git 태그. 패키지가 2개가 되는 순간(Phase 1) **Changesets** 도입 + GitHub Packages(비공개 npm) 승격 (Primer/Polaris/Spectrum 표준 스택).

## 10. 단계별 계획

- **Phase 0 — 토큰 기반 (며칠; 유일하게 완벽해야 하는 단계)**
  레포 + DTCG 토큰(primitive/semantic, halfmoon 테마 light+dark) + SD v5 빌드(CSS + TS; 소형 커스텀 TS 포맷 1개 포함) + 마크다운 가이드라인 + CI(PR마다 빌드 = 참조 무결성 검증) + 수동 릴리스 플로우(build → dist/ 커밋 → 태그).
  **완료 기준**: (a) 깨진 참조가 빌드를 실패시킨다, (b) 새 Vite React 앱이 git 의존성으로 토큰을 받아 10분 안에 테마 적용된 UI를 렌더한다(레시피 문서 그대로 따라서), (c) `data-theme` 전환만으로 다크 모드가 동작한다.
- **Phase 1 — React 컴포넌트 (첫 제품 개발과 함께)**
  shadcn/ui 테마링 + 핵심 컴포넌트 큐레이션 + Storybook + **Tailwind v4 `@theme` 출력**(§5의 네임스페이스 결정대로). 레포를 `packages/*` 모노레포로 재구성, component 토큰 tier, Changesets + GitHub Packages, (필요 시) Turborepo는 이때 추가.
- **Phase 2 — 두 번째 표면 (수요 실증 시)**
  두 번째 프레임워크/플랫폼 컴포넌트, 문서 사이트, `$deprecated` + 토큰 diff CI 게이트, 두 번째 테마(프로젝트) 온보딩.
- **Phase 3 — 스케일아웃**
  Flutter/RN/네이티브 출력 와이어링(설정 추가), Resolver 이행(안정화 시).

## 11. 정직한 비용·리스크

- **N개 플랫폼 = N개 컴포넌트 라이브러리 유지선.** 회피 불가. 완화: 출시 전엔 안 만들고, 검증된 프리미티브를 테마링.
- **첫날의 산출물은 토큰+문서다.** 완성된 컴포넌트 킷이 아님 — 토큰이 탄탄하면 컴포넌트는 플랫폼별로 싸게 따라온다.
- **SD v5의 2025.10 지원은 부분적** (Resolver 미지원 등). 완화: hex 폴백, 버전 고정, 이식 가능한 소스.
- **미래의 손저작 Flutter 테마는 토큰 rename 시 수동 동기화 필요** (값은 자동 동기화됨). 토큰 churn이 심해지면 그때 코드젠으로 승격 — 가역적.
