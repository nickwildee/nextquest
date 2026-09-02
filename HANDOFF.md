# NextQuest 작업 인수인계

> 기준 시점: 2026-09-02 (Asia/Seoul)
>
> 이 문서는 다른 에이전트나 로컬 환경에서 제품 검토와 M1 작업을 이어가기 위한 상태 기록이다. 제품 정의의 최종 책임은 `docs/` 아래 제품 문서에 있고, 작업 방식은 `AGENTS.md`, Issue별 범위와 완료 조건은 해당 GitHub Issue가 책임진다.

## 프로젝트 목적

NextQuest는 소울라이크 게임 구매를 고민하는 사용자가 검수된 리뷰 분석과 자신의 과거 플레이 경험을 비교해, 후보 게임이 어떤 요소에서 취향과 일치하거나 충돌하는지 판단하도록 돕는 서비스다.

자동 추천이나 종합 점수를 제공하는 서비스가 아니다. 검수된 상위 경험 영역과 구체적인 하위 특성을 기준으로 다음 정보를 근거와 함께 제공하는 것이 핵심이다.

- 게임 자체의 기본 리뷰 분석
- 사용자의 과거 경험과 비교한 `맞을 근거`, `주의 신호`, `판단 불가`
- 각 분석과 판단에 연결된 리뷰 근거
- 사용자가 직접 정하는 `구매 후보`, `보류`, `제외` 상태

MVP의 대표 흐름은 `기본 리뷰 분석 → 과거 게임 등록 및 단계형 경험 평가 → 개인화 비교 → 구매 판단 저장 → 과거 평가 수정 및 재계산`이다. 비교 기준 게임이 없어도 기본 분석은 이용할 수 있고, 한 개 이상 평가하면 근거가 제한된 개인화 결과부터 확인할 수 있다.

## 현재 상태 요약

- 기본 브랜치: `main`
- 제품 문서 정렬 브랜치: `codex/docs/refine-personalization-mvp`
- 작업 시작 기준 `main` 커밋: `b8c502e`
- M1 로드맵 정렬은 [PR #13](https://github.com/nickwildee/nextquest/pull/13), 기존 인수인계 문서는 [PR #14](https://github.com/nickwildee/nextquest/pull/14)로 병합됐다.
- 2026-09-02 제품 검토에서 기존 6개 필수 문항과 3게임 개인화 잠금 규칙을 폐기하고, 단계형 하위 특성 입력과 1게임부터 제공하는 제한적 개인화로 문서를 정렬했다.
- `git stash list`는 비어 있다. Issue #8에 남은 `stash@{0}` 주의 문구는 더 이상 현재 상태와 맞지 않는다.
- GitHub M0는 완료되어 닫혔다.
- GitHub M1 `개발 기반 구축`은 열려 있고 미완료 구현 Issue #11과 #12가 연결되어 있다.
- M1 마감일은 2026-08-21이므로 기준 시점에는 이미 지났다.
- 애플리케이션 코드, `package.json`, workspace, lockfile과 테스트 설정은 아직 없다.

## 2026-09-02 제품 검토 인수인계

### 확정된 방향

- 최우선 목표는 실제 사용자가 구매 판단에 활용할 수 있는 서비스를 만드는 것이다. 취업용 포트폴리오와 학습은 사용자 가치를 구현하면서 얻는 부가 결과다.
- 경험 입력은 고정된 6개 항목을 모두 이분법으로 평가하는 방식이 아니다. 사용자가 관련 있는 상위 경험 영역을 먼저 고르고, 각 영역에서 중요한 하위 특성을 최대 3개까지 선택해 긍정·부정 경험을 구분한다.
- 긍정·부정을 구분한 하위 특성이 한 개 이상 있어야 한 게임의 경험 평가가 완료된다. 선택하지 않은 상위 경험 영역은 비워 둘 수 있다.
- 한 개의 비교 기준 게임부터 개인화 결과를 제공한다. 3개 이상 입력은 잠금 조건이 아니라 반복되는 취향과 예외를 구분하기 위한 권장 목표다.
- 1~2개이면 결과 위에 개인화 근거가 부족하다는 안내와 과거 게임을 추가하는 경로를 항상 제공한다. 3개 이상이어도 선택한 특성의 반복과 범위가 부족하면 안내를 유지하며, 입력 증가가 정확도를 보장한다고 표현하지 않는다.
- 개인화 결과는 가장 강한 `맞을 근거`와 `주의 신호`를 먼저 대비하고, 그 아래에 약한 신호를 이어서 보여준다.
- 사용자에게 중요한 긍정·부정 특성이지만 리뷰 근거가 적거나 충돌하면 결과 최상단이 아닌 별도의 `판단 불가` 목록으로 제공한다. 부정적으로 평가한 특성은 잠재적인 주의 항목임을 함께 표시한다.
- 관련 리뷰가 전혀 없으면 개인화 결과를 만들지 않고 근거 없음 상태를 안내한다. 비어 있는 결과 그룹은 숨기고 모든 그룹이 비면 기본 리뷰 분석을 계속 제공한다.
- 리뷰에서 반복적으로 확인된 특성은 판단 근거 중 하나다. 리뷰를 객관적 진실처럼 표현하지 않고 실제 근거와 불확실성을 함께 노출한다.
- 8개 게임은 관리 가능한 베타 분석 목록이다. 가장 이른 가치 검증은 후보 한 개의 전체 흐름으로 시작하고, 2~3개 후보에서 구조의 재사용성을 확인한 뒤 8개 실제 데이터로 확장한다.

### 인터뷰 메모와 검증 가설

아래 내용은 한 명의 핵심 사용자에게서 얻은 탐색 자료이며 전체 사용자의 요구사항으로 확정하지 않는다.

- 초기 사용 후보는 프로젝트 소유자와 친구 한 명이며, 세 번째 사용자는 아직 정해지지 않았다.
- 사용자는 입력 질문에 10~15분을 투자할 의향이 있다고 답했다. 실제 온보딩 허용 시간은 사용자 테스트로 확인해야 한다.
- 사용자는 DCInside 글·댓글과 YouTube 리뷰를 많이 봤지만, 편집된 장면과 글만으로 실제 조작감, 탐색·루팅의 불쾌함과 필요한 시간 투자를 판단하기 어려워 구매를 포기한 경험이 있다.
- `Clair Obscur: Expedition 33`은 높은 평가 이후 구매했고 예상보다 만족했다. 빌드를 하나씩 구성하는 과정, 특성에 따라 달라지는 캐릭터 운용, 여행하는 감각과 BGM이 핵심 긍정 경험이었다.
- 오픈월드 탐험에서는 광활한 공간, 지역별 뚜렷한 특색, 숨겨진 아이템·몬스터를 선호했다. 제한적인 이동 자유도, 반복 색상 변형 몬스터, 감상을 방해하는 함정과 잡몹 배치는 부정 경험이었으며 그중 반복 색상 변형 몬스터가 가장 강한 주의 요소였다.
- 이 사례는 상위 경험 영역 아래에 구체적인 긍정·부정 하위 특성이 함께 필요하다는 근거로 사용한다. 특정 게임이나 한 사용자의 표현을 전체 분류 체계로 그대로 일반화하지 않는다.
- 사용자는 현재 `Black Myth: Wukong` 구매를 고민하고 있지만, 우콩에 특화된 판정 항목을 설계하기 전에 문서 전반 검토로 돌아오기로 했다.

### 구현 전에 남은 제품 결정

- 상위 경험 영역은 7~8개 수준으로 넓히는 방향이지만 최종 개수, 명칭과 하위 특성 어휘는 확정하지 않았다.
- 사용자 경험의 긍정·부정과 후보 게임 리뷰 특성의 방향·맥락을 `맞을 근거`, `주의 신호`, `판단 불가`로 연결하는 판정표를 확정하지 않았다.
- 리뷰 반복 언급, 서로 독립적인 리뷰 수, 상충 근거와 표본 크기를 어떻게 신호 강도와 정렬에 반영할지 결정하지 않았다.
- 3개 이상에서 특성의 반복·범위로 데이터 충분성을 판단할 기준과 안내의 정확한 문구·강도를 결정하지 않았다.
- 결과 상단에서 긍정·주의 신호를 좌우로 배치하는 안은 디자인 방향이며 작은 화면을 포함한 최종 레이아웃은 UX 설계에서 검증해야 한다.
- 충분한 플레이 경험 기준, 비교 기준 게임 목록과 리뷰 표본 정책은 계속 미정이다.

### 현재 MVP 밖에 둔 확장 논의

- 짧게 플레이하고 중단한 게임을 제한적인 부정 취향 신호로 사용하는 기능
- Steam에 없는 콘솔 게임과 사용자가 직접 입력하는 게임 카탈로그
- 턴제, 리듬, 메트로배니아, 오픈월드 액션 RPG, 헌팅 액션 등 여러 장르로 확장하는 기능
- 공통 경험 영역과 장르별 질문 모듈을 결합하는 구조
- 게임의 현재 상태·보편적 품질 경고를 개인 취향 신호와 분리하는 결과 구조

이 항목들은 방향 탐색 가치가 있지만 소울라이크 MVP의 현재 요구사항이나 구현 범위로 사용하지 않는다.

## 현재 아키텍처

### 저장소에 실제로 존재하는 구조

현재 저장소는 제품 정의 문서만 있는 상태다.

```text
nextquest/
├── AGENTS.md
├── HANDOFF.md
├── README.md
└── docs/
    ├── project-context.md
    └── product/
        ├── development-plan.md
        ├── scope.md
        └── user-flow.md
```

### M1에서 구축하기로 확정한 목표 구조

```text
pnpm workspace
├── apps/
│   └── web/                 Next.js 애플리케이션과 Route Handler
└── packages/
    └── domain/              순수 TypeScript + Zod 도메인 계약과 fixture

packages/domain
    ├── Jest golden fixture eval
    ├── apps/web
    └── MSW handler → 로컬 개발 / Storybook / 테스트

검증 계층
├── *.test.ts(x)             Jest + React Testing Library
├── *.stories.tsx            Storybook Vitest addon + a11y addon
└── e2e/*.spec.ts            Playwright
```

- `apps/web` 하나로 시작한다.
- 웹에 필요한 서버 기능은 Next.js Route Handler로 구현한다.
- M1에는 별도 `apps/api`를 만들지 않는다.
- `packages/domain`은 Next.js, React, HTTP, 데이터베이스에 의존하지 않는다.
- 독립 배포, 여러 클라이언트, 백그라운드 처리 요구가 확인되면 Node.js/TypeScript API 애플리케이션으로 분리한다.
- PostgreSQL은 향후 데이터베이스 후보지만 M1에는 DB, ORM, 마이그레이션과 Docker를 추가하지 않는다.

## 주요 기술적 결정과 그 이유

### 프로젝트와 서버 경계

| 결정 | 이유 | 트레이드오프 |
| --- | --- | --- |
| pnpm workspace 기반 작은 모노레포 | 프론트엔드와 순수 도메인 계약을 한 저장소에서 원자적으로 변경하고, 미래 백엔드 분리를 경험할 수 있다. | 패키지 경계와 workspace 설정을 관리해야 한다. |
| Next.js `apps/web` + Route Handler | 현재는 웹 클라이언트 하나뿐이므로 별도 서버, CORS, 계약 동기화와 독립 배포 비용을 미리 만들지 않는다. | 서버 요구가 커지면 API 애플리케이션으로 옮기는 작업이 필요하다. |
| `packages/domain`을 인프라 독립적으로 유지 | 도메인 규칙과 fixture를 UI, HTTP, DB에서 분리해 Jest로 빠르게 검증하고 미래 서버에서도 재사용한다. | 실제 중복이 생기기 전에는 추가 공용 패키지를 만들지 않아야 한다. |
| PostgreSQL은 미래 후보로만 기록 | 제품 데이터 모델과 실제 저장 요구가 아직 검증되지 않았다. | DB 개발을 시작할 때 ORM, 마이그레이션, Compose를 별도로 결정해야 한다. |

### 개발 도구와 검증 경계

| 경계 | 선택 | 선택 이유 |
| --- | --- | --- |
| 코드 품질 | ESLint | Next.js, React, TypeScript의 오류 패턴을 검사하고 프론트엔드 실무 경험을 쌓는다. |
| 코드 형식 | Prettier | ESLint와 책임을 분리해 자동 포맷과 CI 형식 검사를 일관되게 적용한다. |
| 타입 | TypeScript strict | 컴파일 전에 타입 경계의 오류를 찾는다. |
| 런타임 데이터 | Zod 4 | 외부 입력, API 경계와 fixture가 TypeScript 타입만 믿고 통과하지 않도록 실행 시점에 검증한다. |
| 일반 테스트 | Jest + React Testing Library | 목표 직무에서 자주 쓰는 도구를 학습하며 순수 규칙과 독립적인 Client Component를 사용자 관점으로 검사한다. |
| 컴포넌트 상태 | Storybook + MSW | 실제 API 없이 성공, 로딩, 빈 결과, 오류와 비활성 상태를 재현한다. |
| Story 자동 검증 | Storybook Vitest addon + a11y addon | Story 렌더링, `play` 상호작용과 axe 기반 접근성을 실제 브라우저에서 검사한다. |
| 전체 흐름 | Playwright | 페이지를 연결하는 대표 smoke/E2E 흐름과 실패 trace를 검사한다. |
| 원격 검증 | GitHub Actions | 개발자 로컬 설정과 무관하게 PR마다 같은 검증 명령을 강제한다. |

Jest와 Vitest를 같은 테스트에 중복 적용하지 않는다. 순수 규칙과 독립 컴포넌트는 Jest, 시각적 상태와 Story 상호작용은 Storybook, 전체 페이지 흐름은 Playwright가 책임진다.

### Storybook 브라우저 테스트 결정

다음 경계까지 이 스레드에서 확정했다.

- Next.js용 Storybook은 `@storybook/nextjs-vite`를 사용한다.
- 보수적인 버전 정책에 따라 Story 작성 형식은 안정적인 CSF3 `Meta`/`StoryObj`를 우선한다.
- Storybook Vitest addon의 실제 브라우저 제공자로 `@vitest/browser-playwright`와 Chromium을 도입한다.
- 이 단계의 Playwright는 Story 컴포넌트 테스트용 브라우저 런타임만 책임진다.
- 후속 E2E Issue가 `@playwright/test`, E2E 설정과 trace를 별도로 책임진다.
- a11y 검사는 경고로 끝내지 않고 테스트 실패 조건으로 설정한다.
- MSW handler와 합성 fixture를 로컬 개발, Storybook, Jest의 Node 환경에서 재사용하되 순수 도메인 테스트에는 HTTP mock을 강제하지 않는다.
- production에서는 MSW를 시작하지 않는다.
- M2 제품 UI를 미리 구현하지 않고 Story 파일 내부의 작은 검증용 컴포넌트로 로딩, 성공, 빈 결과와 오류 상태를 증명한다.

2026-08-19에 확인한 설치 후보는 Storybook 10.5.9, Vitest 4.1.11, MSW 2.15.0, `msw-storybook-addon` 3.0.0이었다. 이는 최종 고정 버전이 아니다. 실제 Storybook/MSW Issue를 시작할 때 공식 문서, 안정 패치 버전과 peer dependency를 다시 확인해야 한다.

### 버전과 업데이트 정책

Issue #11의 첫 스캐폴딩 기준은 다음과 같다. 아직 설치하지 않았다.

| 도구 | 고정 예정 버전 |
| --- | --- |
| Node.js | 24.19.0 LTS |
| pnpm | 11.21.0 |
| Next.js | 16.3.1 |
| React / React DOM | 19.2.8 |
| TypeScript | 6.0.3 |
| ESLint | 10.8.1 |
| eslint-config-next | 16.3.1 |
| Prettier | 3.9.6 |
| Jest | 30.4.2 |
| React Testing Library | 16.3.2 |

직접 의존성, Node와 pnpm은 정확한 버전으로 고정하고 `pnpm-lock.yaml`을 커밋한다. CI는 `pnpm install --frozen-lockfile`을 사용한다. `latest`, `next`, `canary`, `beta`, `rc` 태그는 사용하지 않는다. 버전 변경은 기능 변경과 분리한 PR에서 처리한다.

TypeScript 7 대신 6.0.3을 선택한 것은 최신 버전을 무조건 피한 것이 아니다. TypeScript 7.0의 프로그래밍 API와 주변 도구 호환성 전환 위험을 피하고, 7.1과 `typescript-eslint`·Storybook의 공식 지원이 확인될 때 별도 업그레이드로 경험하기 위한 호환성 예외다.

### 보류한 도구

- Husky와 lint-staged: 빠른 로컬 검증 명령이 안정화된 뒤 반복되는 실수를 실제로 줄일 수 있는지 확인하고 도입한다. 최종 강제 기준은 Git hook이 아니라 GitHub Actions다.
- Docker: M1에는 격리할 DB와 별도 서버가 없다. 실제 PostgreSQL 개발을 시작할 때 DB용 Compose부터 검토하고, 애플리케이션 Dockerfile은 배포 환경이 요구할 때 결정한다.
- 별도 백엔드 저장소: 현재는 공유 계약 변경을 원자적으로 다루는 작은 모노레포가 더 단순하다. 독립 권한, 릴리스 주기와 배포 요구가 생기면 분리를 재검토한다.
- Biome: 더 간단하고 빠르지만 ESLint와 Prettier의 실무 학습 목표를 우선했다.
- Vitest 단일 실행기: Storybook과 단순하게 통합되지만 Jest 학습 목표를 충족하지 못한다.

## 지금까지 구현한 것

### `main`에 병합된 것

- Issue/PR 템플릿
- 프로젝트 한 문장 정의와 핵심 문서 진입점
- 프로젝트 컨텍스트, MVP 범위, 대표 사용자 흐름과 개발 계획
- 저장소 작업 원칙 `AGENTS.md`
- M0 `제품 정의 및 초기 세팅` 완료 및 close
- M1/M2 로드맵 번호와 기술 경계 정렬
- 비교 기준 게임의 한국어 인터페이스 필수 조건 정정

### GitHub에 기록된 것

- [Issue #8: M1 로드맵 정렬 및 기술 기반 결정](https://github.com/nickwildee/nextquest/issues/8), 완료
- [PR #13: M1 로드맵 및 기술 기반 정렬](https://github.com/nickwildee/nextquest/pull/13), merge
- [Discussion #9: M1 개발 기반과 검증 도구 경계](https://github.com/nickwildee/nextquest/discussions/9), 상태 `Accepted`
- [Discussion #10: M1 버전 및 업데이트 정책](https://github.com/nickwildee/nextquest/discussions/10), 상태 `Accepted`
- [Issue #11: pnpm 모노레포 스캐폴딩과 빠른 내부 검증 루프](https://github.com/nickwildee/nextquest/issues/11)
- [Issue #12: 도메인 스키마와 golden fixture eval](https://github.com/nickwildee/nextquest/issues/12)

아직 애플리케이션이나 개발 하네스를 구현한 것은 아니다. 위 항목 중 구현으로 볼 수 있는 것은 문서와 GitHub 명세뿐이다.

## 현재 작업 중인 것

애플리케이션 구현은 아직 시작하지 않았다. 기술 기반 작업은 Issue #11의 pnpm 모노레포 스캐폴딩과 빠른 내부 검증 루프부터 이어갈 수 있다. Issue #12는 폐기된 6개 필수 항목과 3게임 잠금 규칙을 전제로 작성되어 있으므로 상위 영역·하위 특성 어휘, 개인화 판정표, 신호 강도·정렬과 데이터 부족 정책을 확정한 뒤 본문과 완료 조건을 먼저 수정해야 한다.

Storybook/MSW 후속 Issue의 범위는 이 스레드에서 확정했지만 GitHub Issue는 아직 만들지 않았다. Playwright smoke/E2E와 GitHub Actions CI Issue는 후속 검토가 필요하다.

## 아직 구현하지 않은 것

- pnpm workspace와 `apps/web`
- Node/pnpm 버전 파일과 `packageManager` 설정
- Next.js, React, TypeScript 설치
- ESLint, Prettier와 TypeScript strict 설정
- Jest와 React Testing Library 설정
- 루트 실행·검증 명령
- `packages/domain`, Zod 스키마, 순수 도메인 규칙과 golden fixture eval
- Storybook, MSW, story 테스트와 a11y 검사
- Playwright smoke/E2E, trace와 GitHub Actions
- 실제 NextQuest UI와 M2 대표 사용자 흐름
- Steam 계정 연동, 인증, 리뷰 수집, 온라인 AI 호출
- PostgreSQL, ORM, 마이그레이션과 Docker
- 8개 게임 전체의 실제 분석 데이터
- Husky와 lint-staged

## 알려진 문제/TODO

- 닫힌 Issue #8의 본문에는 기존 `stash@{0}` 주의 문구가 남아 있지만, 사용자의 명시적 승인으로 해당 stash를 삭제했고 현재 `git stash list`는 비어 있다.
- M1 마감일 2026-08-21이 지났다. 일정이나 마감일을 조정할지는 미정이다.
- Issue #12의 `6개 경험 요소`, 모든 요소 필수 평가, 완료된 3게임만 개인화 준비라는 명세는 현재 제품 문서와 충돌한다. 구현 전에 상위 영역·하위 특성 구조와 제한적 개인화 규칙으로 갱신해야 한다.
- 현재 GitHub 연동은 읽기가 가능하지만 Issue 생성 API는 403, 로컬 `gh` 인증은 만료 상태였다. 별도 문서 Issue를 만들지 못했으므로 인증 복구 후 이 문서 정렬 작업과 Issue #12 갱신 기록을 GitHub에 연결해야 한다.
- Storybook/MSW Issue와 Playwright/GitHub Actions Issue는 아직 만들지 않았다.
- Storybook/MSW 설치 전에 안정 패치 버전과 peer dependency를 다시 확인해야 한다.
- `msw-storybook-addon` v3는 CSF3 호환 경로를 제공하지만 CSF Next 사용을 권장한다. 반면 확인 당시 Storybook 문서는 CSF Next를 실험적 기능으로 표시했다. 보수적 정책에 따라 CSF3를 우선하되 구현 시 공식 지원 상태를 다시 확인한다.
- 충분한 플레이 시간, 비교 기준 게임 목록, 리뷰 표본·언어·최신성 정책은 제품 문서상 아직 미정이다.
- 사용자 인증, 실제 데이터 저장과 세부 DB/API 정책은 M1 범위 밖이다.

## 중요한 파일 및 디렉토리

| 경로 | 책임 | 상태 |
| --- | --- | --- |
| `AGENTS.md` | 작업 방식, 학습 중심 설명, 문서·Git·검증 원칙 | 병합됨, 작업 전 필독 |
| `README.md` | 프로젝트 한 문장 소개와 핵심 문서 진입점 | 2026-09-02 작업 인수인계 링크 추가 |
| `HANDOFF.md` | 확정된 결정, 인터뷰 메모와 다음 작업의 인수인계 | 2026-09-02 갱신 |
| `docs/project-context.md` | 문제, 사용자, 핵심 가치와 제품 원칙 | 2026-09-02 제품 방향 반영 |
| `docs/product/scope.md` | MVP 포함·제외 범위, 성공 기준과 미정 정책 | 2026-09-02 개인화 구조 반영 |
| `docs/product/user-flow.md` | 대표 행동 순서와 예외 흐름 | 2026-09-02 개인화 흐름 반영 |
| `docs/product/development-plan.md` | M0~M4 개발 순서와 완료 조건 | 2026-09-02 검증 순서 반영 |
| `apps/web/` | Next.js 웹 애플리케이션과 Route Handler | 아직 없음, Issue #11 |
| `packages/domain/` | 도메인 스키마, 규칙과 합성 fixture | 아직 없음, Issue #12 |
| `e2e/` | Playwright 대표 흐름 테스트 | 아직 없음, 후속 Issue |

## 실행/빌드/테스트 방법

### 현재 실행 가능한 것

아직 `package.json`과 애플리케이션 코드가 없으므로 개발 서버, 빌드와 자동 테스트를 실행할 수 없다. 현재는 문서와 Git 상태만 검증할 수 있다.

```bash
git status --short --branch
git diff --check
git show --stat b8c502e
rg -n "처음에는|검토했지만|합의한|초안|현재 문서는|임의로|숫자를 맞추기|사용자 확인 후|나중에 결정" README.md docs HANDOFF.md
```

### Issue #11 완료 후 제공할 루트 명령

아래 명령은 계획된 인터페이스이며 현재는 실행되지 않는다.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

### 후속 하네스 완료 후 추가할 명령

정확한 이름은 해당 Issue에서 최종 확인하되 다음 책임을 유지한다.

```bash
pnpm storybook
pnpm build-storybook
pnpm test:stories
pnpm test:e2e
```

## 다음에 해야 할 작업

1. 다른 로컬에서 `main`을 갱신하고 `AGENTS.md`, 이 문서와 제품 문서를 읽는다.
2. M1의 기술 기반만 다루는 Issue #11을 진행한다.
3. M2 도메인 구현 전에 상위 경험 영역·하위 특성 어휘, 개인화 판정표, 신호 강도·정렬과 데이터 부족 정책을 확정한다.
4. 확정된 제품 규칙으로 Issue #12의 본문, golden fixture 사례와 완료 조건을 갱신한다.
5. M1 마감일이 지난 상태를 유지할지 GitHub 마일스톤 일정을 조정한다.
6. 확정된 범위로 Storybook/MSW 후속 Issue를 생성한다.
   - `@storybook/nextjs-vite`
   - Storybook Vitest addon과 `@vitest/browser-playwright`/Chromium
   - a11y 실패 조건
   - 공용 MSW handler와 브라우저/Node adapter
   - story-local 상태 검증 컴포넌트
   - M2 제품 UI와 E2E는 제외
7. Playwright smoke/E2E와 GitHub Actions CI Issue의 세부 범위를 검토하고 생성한다.
8. Issue #12에서 `packages/domain`과 golden fixture eval을 구현한다.
9. Storybook/MSW Issue를 구현한다.
10. Playwright/GitHub Actions Issue를 구현해 M1 완료 조건을 닫는다.

## 앞으로 작업할 때 지켜야 할 규칙

### 의사결정과 학습

- 작업 전에 `AGENTS.md`, 관련 Issue, 제품 문서, 현재 브랜치와 작업 트리를 읽는다.
- 제품 작업은 `문제와 목적 → MVP 범위 → 사용자 흐름 → 개발 순서 → 기술과 구현` 순서로 진행한다.
- 결과에 큰 영향을 주는 결정은 한 번에 가장 중요한 질문 하나만 하고 사용자 확인을 받는다.
- 답변과 문서에서 확정된 사실, 작업을 위한 가정, 미확정 사항을 구분한다.
- 새 기술은 해결할 문제, 동작 원리, 대안, 선택 이유, 구현과 검증 순서로 설명한다.
- 현재 필수, 알아두면 좋음, 지금 생략할 내용을 구분하고 충분한 깊이에 도달하면 구현으로 넘어간다.
- 외부 서비스, 라이브러리 버전과 정책처럼 바뀔 수 있는 정보는 공식 1차 출처로 다시 확인한다.

### 범위와 설계

- YAGNI, KISS, DRY를 지킨다.
- 새 문서, 패키지와 추상화는 현재 Issue를 해결할 때만 추가한다.
- M1에서 실제 Steam 연동, 인증, DB, 리뷰 수집, 온라인 AI와 제품 사용자 흐름을 구현하지 않는다.
- 별도 `apps/api`, PostgreSQL, ORM, Docker, Husky는 재검토 조건이 충족되기 전까지 추가하지 않는다.
- 화면은 성공 상태뿐 아니라 로딩, 빈 결과, 오류와 비활성 상태를 함께 설계한다.
- 시맨틱 HTML, 연결된 레이블, 키보드 조작과 자연스러운 포커스 이동을 기본으로 확인한다.

### 데이터와 테스트

- 실제 사용자·Steam 계정 데이터와 비밀값을 코드, 문서, fixture, 로그에 넣지 않는다.
- fixture는 합성 데이터만 사용하고 외부 리뷰 본문을 복사하지 않는다.
- golden fixture의 기대 결과는 스냅샷으로 대체하지 않는다.
- `*.test.ts(x)`는 Jest, `*.stories.tsx`는 Storybook Vitest addon, `e2e/*.spec.ts`는 Playwright가 책임진다.
- 같은 사용자 행동을 여러 테스트 계층에서 반복 검증하지 않는다.
- 구현 후 `format → lint → typecheck → unit/component test → Storybook/a11y → Playwright → 자체 리뷰 → 수정` 순서로 review-repair loop를 수행한다.
- 완료 보고 전에 변경 범위에 맞는 테스트, 타입, 포맷, 문서 링크 검사를 실행한다.

### Git과 GitHub

- 하나의 Issue는 하나의 브랜치와 PR로 처리하고 관련 없는 변경을 섞지 않는다.
- `main`에 직접 구현하지 않는다.
- 사용자의 기존 변경을 적용, 삭제, 덮어쓰지 않는다.
- 작업 트리가 섞여 있으면 대상 경로만 스테이징하고 `git add .` 또는 `git add -A`를 사용하지 않는다.
- 커밋과 PR 전에 변경 요약, 커밋 범위와 PR 본문 초안을 사용자에게 먼저 보여준다.
- 사용자 승인 없이 commit, push와 PR 생성을 하지 않는다.
- Issue를 Spec-lite 명세로 사용해 `Spec → Plan → Tasks → Implement` 순서를 지킨다.

## 관련 GitHub 항목

- 저장소: <https://github.com/nickwildee/nextquest>
- M1: <https://github.com/nickwildee/nextquest/milestone/2>
- Issue #8: <https://github.com/nickwildee/nextquest/issues/8>
- PR #13: <https://github.com/nickwildee/nextquest/pull/13>
- Discussion #9: <https://github.com/nickwildee/nextquest/discussions/9>
- Discussion #10: <https://github.com/nickwildee/nextquest/discussions/10>
- Issue #11: <https://github.com/nickwildee/nextquest/issues/11>
- Issue #12: <https://github.com/nickwildee/nextquest/issues/12>
