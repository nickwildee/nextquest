# 🛠 Project Rules & Conventions

이 문서는 프로젝트의 일관성을 유지하고, 코드 리뷰어를 위해 정의한 개발 규칙입니다.

## 📌 Commit Message Convention

커밋 메세지는 Git의 표준 컨벤션을 따르며, 영어로 일관성 있게 작성합니다.

- **Feat**: 새로운 기능 추가
- **Fix**: 버그 수정
- **Docs**: 문서 수정 (README, Wiki 등)
- **Style**: 코드 포맷팅, 세미콜론 누락 등 (코드 로직 변경 없음)
- **Refactor**: 코드 리팩토링 (기능 변경 없이 가독성/구조 개선)
- **Test**: 테스트 코드 추가 및 수정
- **Chore**: 패키지 매니저 설정, 환경 변수 변경, 빌드 업무 수정

`ex` Feat: Add Steam API integration for fetching reviews

## 🌿 Branch Strategy: Git Flow

이 프로젝트는 **Git Flow** 모델을 간소화하여 사용하며, 모든 개발은 브랜치를 통해 관리합니다.

### 1. 주요 브랜치 (Main Branches)

- **`main`**: 사용자에게 배포되는 최종 브랜치입니다. 항상 안정적인 상태를 유지해야 합니다.
- **`develop`**: 다음 출시 버전을 개발하는 통합 브랜치입니다. 모든 기능 개발의 기준점이 됩니다.

### 2. 보조 브랜치 (Supporting Branches)

- **`feature/[기능명]`**: 새로운 기능을 개발할 때 사용합니다.
  - `develop`에서 생성하고, 완료 후 `develop`으로 Merge합니다.
  - 예: `feature/steam-api-5000-reviews`, `feature/recommendation-logic`
- **`hotfix/[버그명]`**: `main` 브랜치에서 발견된 긴급한 버그를 수정할 때 사용합니다.
  - `main`에서 생성하고, 완료 후 `main`과 `develop` 양쪽에 Merge합니다.

---

## 🚀 Work Flow (작업 흐름)

1. **Issue 발행**: 작업할 내용을 Issue에 등록합니다.
2. **Feature 브랜치 생성**: `develop` 브랜치에서 분기합니다. (`git checkout -d feature/name`)
3. **작업 및 커밋**: 정해진 커밋 컨벤션에 따라 작업합니다.
4. **PR (Pull Request)**: 작업 완료 후 `feature` -> `develop`으로 PR을 올립니다.
5. **셀프 리뷰 및 머지**: 코드 확인 후 `develop`에 병합하고 해당 feature 브랜치는 삭제합니다.
6. **배포**: 기능이 모이면 `develop`을 `main`으로 병합하여 배포합니다.

## 💻 Coding Style

### 1. Naming

- **변수 / 함수**: `camelCase` (예: `getSteamReview`)
- **컴포넌트**: `PascalCase` (예: `GameCard.tsx`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_REVIEW_COUNT = 5000`)

## 📂 Folder Structure (FSD: Feature-Sliced Design)

본 프로젝트는 확장성과 유지보수를 위해 **Feature-Sliced Design** 아키텍처를 따릅니다.

- **src/app**: 앱 진입점, 전역 설정 (Providers, Styles)
- **src/pages**: 라우트별 페이지 컴포넌트
- **src/widgets**: 레이아웃을 구성하는 독립적인 큰 UI 블록 (예: `ReviewSection`)
- **src/features**: 유저 인터랙션이 포함된 기능 단위 (예: `FilterByPlaytime`, `LikeGame`)
- **src/entities**: 도메인 모델 및 비즈니스 로직 (예: `GameCard`, `ReviewData`, `useSteamStore`)
- **src/shared**: 재사용 가능한 UI 컴포넌트 및 유틸리티 (예: `Button`, `APIClient`)

⚠️ **중요 규칙**: 상위 레이어는 하위 레이어를 참조할 수 있지만, **하위 레이어는 상위 레이어를 참조해서는 안 됩니다.**  
(예: `entities`에서 `features`를 불러올 수 없음)

---

## 📝 Pull Request & Issue

작업 단위마다 **Issue**를 발행하고, **PR**을 통해 셀프 리뷰를 진행한 뒤 `main`에 병합합니다.

- Issue를 통해 '오늘 할 일'을 정의합니다.
- PR 메시지에는 해당 기능의 구현 화면(스크린샷)이나 주요 변경점을 기록합니다.
