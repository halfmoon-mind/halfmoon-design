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
