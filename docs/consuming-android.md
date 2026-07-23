# Android(Compose)에서 halfmoon 사용하기 (5분)

토큰만 제공한다 (Compose 컴포넌트 없음). JitPack이 GitHub 태그에서 AAR을 빌드해 서빙한다 — 로컬 체크아웃 불필요.

> 요구사항: **minSdk 21+**, Jetpack Compose가 설정된 앱.

## 1. 설치

`settings.gradle.kts`에 JitPack 저장소 추가:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
```

앱 모듈 `build.gradle.kts`에:

```kotlin
dependencies {
    implementation("com.github.halfmoon-project:halfmoon-design:tokens-v0.4.0")
}
```

버전은 이 레포의 `tokens-v*` git 태그를 그대로 쓴다.

## 2. 사용

```kotlin
import halfmoon.tokens.HM

// 색상 — 라이트/다크 자동 전환 (isSystemInDarkTheme), @Composable 컨텍스트에서만 접근
Text("hello", color = HM.color.fgDefault)
Box(Modifier.background(HM.color.bgDefault))

// 스페이싱/라디우스
Modifier.padding(HM.space._4)                          // 16.dp
Modifier.clip(RoundedCornerShape(HM.radius.md))

// 타이포그래피 — 시스템 폰트 기준 (Pretendard 번들 없음)
Text("제목", style = HM.typography.headingLg.textStyle)
Text("본문", fontSize = HM.fontSize.md, fontWeight = HM.fontWeight.medium)
```

## 이름 규칙

CSS 변수 `--hm-color-bg-default` ↔ Kotlin `HM.color.bgDefault`. 숫자로 시작하는 키는 `_` 접두: `space.4` → `HM.space._4`, `2xl` → `._2xl`. 색상은 semantic만 노출한다 (primitive 직접 참조 금지 원칙).
