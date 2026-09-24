# NextQuest 작업 인수인계

> 마지막 검증: 2026-09-24 (Asia/Seoul)
>
> 검토 기준: `origin/main`의 `d2113ea` (`docs: M1 인수인계와 개발 하네스 추적 정렬 (#25)`)
>
> 이 문서는 다른 컴퓨터나 새 대화에서 작업을 재개하기 위한 운영 문서다. 제품의 현재 동작과 범위는 `docs/`가 책임지며, 상태가 달라졌다면 저장소와 GitHub를 다시 확인해 이 문서를 갱신한다.

## 다른 컴퓨터에서 시작하기

저장소가 없다면 먼저 복제한다.

```bash
git clone https://github.com/nickwildee/nextquest.git
cd nextquest
```

저장소가 이미 있다면 기존 작업을 덮어쓰지 말고 현재 상태부터 확인한다.

```bash
git status --short --branch
git branch --show-current
```

- 수정 파일이나 추적하지 않는 파일이 있으면 stash, reset, checkout 또는 삭제로 정리하지 말고 작업 소유자에게 먼저 확인한다.
- 예상하지 않은 브랜치에 있거나 `main`과 원격 이력이 갈라졌다면 merge, rebase 또는 cherry-pick을 임의로 실행하지 않는다.
- 병합이 끝난 작업 브랜치가 아니라 최신 `main`에서 새 작업을 시작한다.
- GitHub 상태를 확인할 수 있으면 열린 PR과 작업할 Issue를 먼저 확인한다.

작업 트리가 깨끗하고 기존 변경과 브랜치에 문제가 없을 때 `main`을 동기화한다.

```bash
git fetch --prune origin
git switch main
git pull --ff-only
git status --short --branch
git log -5 --oneline --decorate
```

```bash
gh pr list --state open
gh issue view 11
```

## 먼저 읽을 문서

1. [`AGENTS.md`](AGENTS.md): 작업 방식, 문서 책임과 Git 안전 규칙
2. [`docs/project-context.md`](docs/project-context.md): 문제, 사용자와 핵심 가치
3. [`docs/product/scope.md`](docs/product/scope.md): fixture MVP 범위와 미확정 정책
4. [`docs/product/user-flow.md`](docs/product/user-flow.md): 정상·예외 사용자 흐름
5. [`docs/product/review-analysis.md`](docs/product/review-analysis.md): 리뷰 분석, 근거와 비용 통제
6. [`docs/product/development-plan.md`](docs/product/development-plan.md): M0~M4 개발 순서
7. [`docs/technical/steam-api-contract.md`](docs/technical/steam-api-contract.md): Steam 응답과 정규화 경계
8. 구현하려는 GitHub Issue 본문과 연결된 Discussion

README는 진입점이고 세부 요구사항을 소유하지 않는다. 문서와 Issue가 충돌하면 임의로 구현하지 말고 충돌과 영향을 사용자에게 보고한다.

## 현재 확인된 상태

| 구분 | 상태 | 근거 |
| --- | --- | --- |
| M0 제품 정의 | 완료 | 제품 문서, [PR #22](https://github.com/nickwildee/nextquest/pull/22), [PR #24](https://github.com/nickwildee/nextquest/pull/24) |
| M1 기술 결정 | 완료 | [Issue #8](https://github.com/nickwildee/nextquest/issues/8), [Discussion #9](https://github.com/nickwildee/nextquest/discussions/9), [Discussion #10](https://github.com/nickwildee/nextquest/discussions/10) |
| 애플리케이션 구현 | 미착수 | `package.json`, workspace, `apps/web`, `packages/domain`, lockfile과 테스트 설정이 없음 |
| M1 구현 | 미착수 | Issue #11, #12, #18, #19가 열려 있음 |
| Steam·인증·DB 연동 | 미착수 | fixture MVP의 제외 범위 |
| 실제 리뷰 LLM 처리 | 미실행 | 유료 API 호출과 실제 리뷰 데이터가 저장소에 없음 |

현재 저장소에는 문서와 GitHub 템플릿만 있다. 따라서 `pnpm install`, `pnpm dev`, `pnpm verify` 또는 애플리케이션 테스트를 아직 실행할 수 없다. 이 명령들은 Issue #11이 완료되고 실제 스크립트가 생긴 뒤 이 문서에 추가한다.

현재 상태를 다시 확인하는 최소 명령은 다음과 같다.

```bash
git status --short --branch
git ls-tree -r --name-only HEAD
gh issue list --milestone "M1 — 개발 기반 구축" --state all
```

## 구현자가 놓치면 안 되는 제품 경계

상세 규칙은 제품 문서를 따르되, 구현 전에 특히 혼동하기 쉬운 현재 기준은 다음과 같다.

- 첫 MVP는 외부 사용자를 위한 완성 서비스가 아니라 **내부검증용 fixture 프로토타입**이다.
- 개인화에는 조건을 충족하고 평가를 완료한 비교 기준 게임이 최소 3개 필요하며, 유효한 모든 게임을 계산에 사용한다.
- 각 비교 게임의 모든 상위 경험 영역을 확인한다.
- 충분히 경험한 영역에서는 중요한 하위 특성을 1~3개 선택하고 각 특성에 `좋았음` 또는 `아쉬웠음`을 표시한다.
- 같은 상위 영역에 좋아한 특성과 아쉬웠던 특성이 함께 존재할 수 있다.
- 충분히 경험하지 않은 영역은 `경험 부족`으로 완료하고 해당 영역의 취향 계산에서 제외한다.
- 결과는 상위 영역과 하위 특성별 `맞을 근거`, `주의 신호`, `판단 불가`로 제공하며 종합 적합도 점수를 만들지 않는다.
- 정상 사용자 흐름의 노출 결과는 검수된 실제 리뷰 원문 근거를 참조한다.
- 사용자 요청 시 Steam이나 LLM을 호출하지 않고 고정 fixture를 사용한다.

고정된 6개 단일 평가는 현재 계약이 아니다. 상위 경험 영역의 최종 개수·명칭과 영역별 하위 특성 분류표·동의어는 구현 전에 결정해야 한다. 계약 정정 근거는 [PR #24](https://github.com/nickwildee/nextquest/pull/24)와 [Issue #12](https://github.com/nickwildee/nextquest/issues/12)에서 확인한다.

## M1 작업 지도

M1은 아래 순서로 진행한다. 각 Issue는 별도 브랜치와 PR로 처리한다.

| 순서 | Issue | 결과 | 시작 조건 |
| ---: | --- | --- | --- |
| 완료 | [#8 기술 기반 결정](https://github.com/nickwildee/nextquest/issues/8) | pnpm workspace, Next.js, 테스트 도구와 버전 정책 | 완료됨 |
| 1 | [#11 pnpm·Next.js 스캐폴딩](https://github.com/nickwildee/nextquest/issues/11) | `apps/web`, 공통 명령, Jest와 lockfile | 바로 시작 가능 |
| 2 | [#12 도메인 스키마와 golden fixture](https://github.com/nickwildee/nextquest/issues/12) | `packages/domain`, Zod 계약과 순수 규칙 테스트 | #11 병합, 상위 영역·하위 특성 분류표 확정 후 |
| 3 | [#18 Storybook·MSW 하네스](https://github.com/nickwildee/nextquest/issues/18) | 컴포넌트 상태, 접근성과 공용 HTTP mock | #11, #12 병합 후 |
| 4 | [#19 Playwright·GitHub Actions](https://github.com/nickwildee/nextquest/issues/19) | 브라우저 smoke test와 PR 검증 | #11, #12, #18 병합 후 |

Issue 상태와 선행 조건이 바뀌면 이 표보다 GitHub의 최신 본문을 우선하고 `HANDOFF.md`를 함께 갱신한다.

## 다음 작업

다음 구현 작업은 [Issue #11](https://github.com/nickwildee/nextquest/issues/11)이다.

1. 최신 `main`, 열린 PR과 Issue #11 본문을 다시 확인한다.
2. 같은 작업을 진행 중인 브랜치나 PR이 없을 때 최신 `origin/main`에서 Issue #11 전용 브랜치를 만든다.
3. Issue에 기록된 Node.js, pnpm, Next.js와 도구 버전을 설치 직전 공식 문서에서 다시 확인한다.
4. 버전을 바꿔야 한다면 설치부터 하지 말고 확인한 사실, 영향과 대안을 사용자에게 보고한다.
5. Issue #11의 포함 범위만 구현하고 `packages/domain`, Storybook, MSW, Playwright와 CI를 미리 추가하지 않는다.
6. 새 환경에서 frozen install, 개발 서버, format, lint, typecheck, Jest, build와 통합 검증 명령을 확인한다.

새 브랜치명 예시는 `codex/chore/11-pnpm-next-scaffold`다. 같은 이름이 이미 존재하면 덮어쓰거나 강제로 재사용하지 않는다.

## 목표 구조와 의존 방향

M1의 목표 구조는 다음과 같다. 현재 존재하는 구조가 아니라 Issue #11과 #12가 순서대로 만들 구조다.

```text
pnpm workspace
├── apps/web
│   ├── Next.js UI
│   ├── Route Handler
│   └── packages/domain을 사용
└── packages/domain
    ├── Zod 스키마
    ├── 순수 도메인 규칙
    └── 합성 fixture
```

`apps/web`과 `packages/domain`은 workspace의 형제다. 의존 방향은 `apps/web → packages/domain`이며 `packages/domain`은 React, Next.js, HTTP와 데이터베이스에 의존하지 않는다.

상태 재현 경계는 다음과 같다.

```text
packages/domain의 합성 fixture
├── 순수 도메인 테스트가 직접 사용
└── 공용 MSW handler가 HTTP 응답으로 변환
    ├── 로컬 개발
    ├── Storybook
    └── HTTP 경계가 필요한 테스트

production 빌드에서는 MSW worker를 시작하지 않음
```

세부 책임은 [`docs/product/development-plan.md`](docs/product/development-plan.md)와 각 M1 Issue가 소유한다.

## 구현을 막는 것과 막지 않는 것

- Issue #11을 시작하기 위한 제품 결정 차단 요소는 없다.
- Issue #12는 #11의 workspace와 Jest 검증 루프뿐 아니라 상위 경험 영역과 하위 특성 분류표 확정이 필요하다.
- Issue #18은 #11과 #12, Issue #19는 #11, #12와 #18이 선행돼야 한다.
- 게임별 최소 플레이 시간, 정확한 fixture 게임 구성, 리뷰 안정화·우세 수치와 사용자 검증 통과 기준은 아직 미확정이다. 책임 목록은 [`docs/product/scope.md`](docs/product/scope.md)와 [`docs/product/review-analysis.md`](docs/product/review-analysis.md)에 있다.
- 미확정 제품 정책은 #11의 개발 기반 구축을 막지 않는다.

## 데이터와 비용 안전선

- 실제 Steam 계정 식별자, API 키, 사용자 이름과 전체 리뷰 덤프를 저장소·fixture·로그에 넣지 않는다.
- 자동 테스트는 합성 데이터를 사용한다.
- 실제 리뷰 근거를 추가하려면 작성자 식별자를 제거하고 최소 문장, 출처, 수집 시점과 이용 조건을 검수한다.
- 유료 LLM 호출 전에는 사람 정답 데이터, 예상 토큰과 최대 비용을 제시하고 사용자 승인을 받는다.
- 이 저장소에서는 아직 유료 LLM 호출을 실행하지 않았다.

## Git과 PR 인계 규칙

전체 규칙은 [`AGENTS.md`](AGENTS.md)를 따른다.

- 한 Issue를 한 브랜치와 한 PR로 처리하고 관련 없는 변경을 섞지 않는다.
- 커밋, push와 PR 생성 전에 변경 요약과 PR 본문 초안을 사용자에게 보여주고 승인을 받는다.
- 예상하지 않은 브랜치나 앞서간 기준 브랜치를 발견하면 멈추고 사용자에게 선택지를 보고한다.
- 사용자 승인 없이 merge, rebase, cherry-pick 또는 강제 push로 이력을 바꾸지 않는다.
- PR #14의 처리 방식은 사용자 승인을 받은 일회성 예외였고, PR #15의 Issue 누락은 인증 문제로 생긴 과거 기록이다. 둘 다 현재의 Issue → 브랜치 → PR 원칙을 완화하지 않는다.

## 현재 가능한 검증

애플리케이션 코드가 생기기 전에는 문서와 저장소 상태만 검증한다.

```bash
git status --short --branch
git diff --check
git grep -n -E '6개 경험 요[소]|6개 요소 필[수]|각 요[소].*좋았음.*아쉬웠음.*경험 부족' -- README.md docs HANDOFF.md
git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- .
```

폐기된 개인화 규칙과 충돌 표시는 검색 결과가 없어야 한다. 로컬 Markdown 링크와 코드 펜스의 짝도 확인한다. Issue #11이 병합되면 이 구역에 실제 설치·실행·공통 검증 명령을 추가한다.

## 주요 기록

- [Issue #16: M1 개발 하네스 추적과 운영 문서 정렬](https://github.com/nickwildee/nextquest/issues/16)
- [PR #24: 하위 특성 개인화 입력 계약 복원](https://github.com/nickwildee/nextquest/pull/24)
- [PR #22: fixture MVP와 리뷰 분석 정책 정렬](https://github.com/nickwildee/nextquest/pull/22)
- [Issue #12: 도메인 스키마와 golden fixture eval 구축](https://github.com/nickwildee/nextquest/issues/12)
- [Discussion #9: M1 기술 기반 결정](https://github.com/nickwildee/nextquest/discussions/9)
- [Discussion #10: 버전 및 업데이트 정책](https://github.com/nickwildee/nextquest/discussions/10)
- [Discussion #21: 리뷰 분석과 fixture 데이터 정책](https://github.com/nickwildee/nextquest/discussions/21)
