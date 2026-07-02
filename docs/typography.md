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
