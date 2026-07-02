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
