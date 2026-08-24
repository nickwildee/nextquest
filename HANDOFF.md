# NextQuest 작업 인수인계

> 기준 시점: 2026-08-24 (Asia/Seoul)
>
> 이 문서는 다른 로컬 환경에서 M1 작업을 이어가기 위한 상태 기록이다. 제품 정의의 최종 책임은 `docs/` 아래 제품 문서에 있고, 작업 방식은 `AGENTS.md`, Issue별 범위와 완료 조건은 해당 GitHub Issue가 책임진다.

## 프로젝트 목적

NextQuest는 소울라이크 게임 구매를 고민하는 사용자가 검수된 리뷰 분석과 자신의 과거 플레이 경험을 비교해, 후보 게임이 어떤 요소에서 취향과 일치하거나 충돌하는지 판단하도록 돕는 서비스다.

자동 추천이나 종합 점수를 제공하는 서비스가 아니다. 전투, 조작, 보스전, 탐험, 성장·빌드, 파밍·반복 플레이의 6개 요소를 기준으로 다음 정보를 근거와 함께 제공하는 것이 핵심이다.

- 게임 자체의 기본 리뷰 분석
- 사용자의 과거 경험과 비교한 `맞을 근거`, `주의 신호`, `판단 불가`
- 각 분석과 판단에 연결된 리뷰 근거
- 사용자가 직접 정하는 `구매 후보`, `보류`, `제외` 상태

MVP의 대표 흐름은 `기본 리뷰 분석 → 과거 게임 등록 및 평가 → 개인화 비교 → 구매 판단 저장 → 과거 평가 수정 및 재계산`이다. 개인화 조건을 충족하지 못한 사용자도 기본 분석은 계속 이용할 수 있어야 한다.

## 현재 상태 요약

- 기본 브랜치: `main`
- 인수인계 작성 브랜치: `codex/docs/add-handoff`
- 기준 `main` 커밋: `531af5c8da748d0775d3e2123cf53e50da0ce1b6`
- Issue #8 문서 변경은 [PR #13](https://github.com/nickwildee/nextquest/pull/13)으로 squash merge했고 Issue #8도 닫혔다.
- 이 인수인계 문서는 Issue #8 병합 이후의 상태를 기준으로 작성했다.
- `git stash list`는 비어 있다. Issue #8에 남은 `stash@{0}` 주의 문구는 더 이상 현재 상태와 맞지 않는다.
- GitHub M0는 완료되어 닫혔다.
- GitHub M1 `개발 기반 구축`은 열려 있고 미완료 구현 Issue #11과 #12가 연결되어 있다.
- M1 마감일은 2026-08-21이므로 기준 시점에는 이미 지났다.
- 애플리케이션 코드, `package.json`, workspace, lockfile과 테스트 설정은 아직 없다.

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

Issue #8까지의 기술 결정과 문서 정렬은 끝났다. 애플리케이션 구현은 아직 시작하지 않았으며, 다음 활성 작업은 Issue #11의 pnpm 모노레포 스캐폴딩과 빠른 내부 검증 루프다.

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
- Storybook/MSW Issue와 Playwright/GitHub Actions Issue는 아직 만들지 않았다.
- Storybook/MSW 설치 전에 안정 패치 버전과 peer dependency를 다시 확인해야 한다.
- `msw-storybook-addon` v3는 CSF3 호환 경로를 제공하지만 CSF Next 사용을 권장한다. 반면 확인 당시 Storybook 문서는 CSF Next를 실험적 기능으로 표시했다. 보수적 정책에 따라 CSF3를 우선하되 구현 시 공식 지원 상태를 다시 확인한다.
- 충분한 플레이 시간, 비교 기준 게임 목록, 리뷰 표본·언어·최신성 정책은 제품 문서상 아직 미정이다.
- 사용자 인증, 실제 데이터 저장과 세부 DB/API 정책은 M1 범위 밖이다.

## 중요한 파일 및 디렉토리

| 경로 | 책임 | 상태 |
| --- | --- | --- |
| `AGENTS.md` | 작업 방식, 학습 중심 설명, 문서·Git·검증 원칙 | 병합됨, 작업 전 필독 |
| `README.md` | 프로젝트 한 문장 소개와 핵심 문서 진입점 | 병합됨 |
| `HANDOFF.md` | 확정된 결정과 다음 작업의 인수인계 | 이번 작업에서 생성 |
| `docs/project-context.md` | 문제, 사용자, 핵심 가치와 제품 원칙 | PR #13으로 병합됨 |
| `docs/product/scope.md` | MVP 포함·제외 범위, 성공 기준과 미정 정책 | PR #13으로 병합됨 |
| `docs/product/user-flow.md` | 대표 행동 순서와 예외 흐름 | PR #13으로 병합됨 |
| `docs/product/development-plan.md` | M0~M4 개발 순서와 완료 조건 | PR #13으로 병합됨 |
| `apps/web/` | Next.js 웹 애플리케이션과 Route Handler | 아직 없음, Issue #11 |
| `packages/domain/` | 도메인 스키마, 규칙과 합성 fixture | 아직 없음, Issue #12 |
| `e2e/` | Playwright 대표 흐름 테스트 | 아직 없음, 후속 Issue |

## 실행/빌드/테스트 방법

### 현재 실행 가능한 것

아직 `package.json`과 애플리케이션 코드가 없으므로 개발 서버, 빌드와 자동 테스트를 실행할 수 없다. 현재는 문서와 Git 상태만 검증할 수 있다.

```bash
git status --short --branch
git diff --check
git show --stat 531af5c8da748d0775d3e2123cf53e50da0ce1b6
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

1. 다른 로컬에서 `main`을 갱신하고 `AGENTS.md`, 이 문서, Issue #11을 읽는다.
2. M1 마감일이 지난 상태를 유지할지 GitHub 마일스톤 일정을 조정할지 결정한다.
3. 확정된 범위로 Storybook/MSW 후속 Issue를 생성한다.
   - `@storybook/nextjs-vite`
   - Storybook Vitest addon과 `@vitest/browser-playwright`/Chromium
   - a11y 실패 조건
   - 공용 MSW handler와 브라우저/Node adapter
   - story-local 상태 검증 컴포넌트
   - M2 제품 UI와 E2E는 제외
4. Playwright smoke/E2E와 GitHub Actions CI Issue의 세부 범위를 검토하고 생성한다.
5. Issue #11에서 공식 버전과 peer dependency를 다시 확인한 뒤 스캐폴딩과 빠른 내부 검증 루프를 구현한다.
6. Issue #12에서 `packages/domain`과 golden fixture eval을 구현한다.
7. Storybook/MSW Issue를 구현한다.
8. Playwright/GitHub Actions Issue를 구현해 M1 완료 조건을 닫는다.

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
