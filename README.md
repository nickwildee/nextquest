# 🎮 Steam Game Recommender

AI 기반 Steam 게임 추천 및 할인 게임 브라우징 서비스

> Steam 라이브러리 분석을 통한 개인화 추천과 실시간 할인 정보를 한곳에서.

---

## 프로젝트 소개

Steam Game Recommender는 두 가지 핵심 경험을 제공합니다.

**1. AI 개인화 추천**
Steam OpenID 로그인을 통해 유저의 라이브러리와 플레이타임을 분석합니다. 직접 선택한 조건(장르, 가격대, PC 사양, 플레이타임)을 조합하여 취향에 맞는 게임을 추천하며, 상위 3개 결과에는 AI가 분석한 구체적인 추천 근거를 제공합니다.

**2. 할인 & 인기 게임 브라우징**
로그인 없이도 현재 할인 중인 게임과 높은 평가를 받은 인기 게임을 탐색할 수 있습니다. 넷플릭스 스타일의 UI를 통해 장르별, 인기별, 할인율순으로 최적의 게임을 발굴하세요.

---

## 타겟 유저

- **라이트 유저** — 스트리머 방송이나 과거 플레이 경험을 떠올리며 "비슷한 게임 없나?" 찾는 유저
- **할인 게임 헌터** — 관심 게임의 할인 여부를 확인하거나, 할인 목록에서 가성비 좋은 게임을 발굴하는 유저

---

## 주요 기능

### 랜딩 페이지

- 넷플릭스 스타일 UI — 히어로 슬라이더(인기 할인 Top 5)와 가로 스크롤 섹션
- 압도적 긍정적 할인 게임, 인기 게임, 장르별/할인율순 브라우징
- 리뷰 5,000개 이상 & 긍정적 평가 게임만 노출

### AI 추천

- Steam OpenID 로그인 후 라이브러리 자동 분석
- 4가지 프리셋 선택지로 조건 입력 (장르 / 가격대 / PC 사양 / 플레이타임)
- Top 3 근거 카드: 유저 플레이 성향과 게임 특징의 매칭 이유 제시
- 나머지 추천 리스트: AI 추천도 점수 높은순 정렬

### 게임 상세 페이지

- 기본 정보, 가격/할인, 리뷰 요약, 스크린샷
- YouTube API 연동 — 해당 게임 관련 인기 영상 및 쇼츠 노출
- Steam 스토어 바로가기

### 마이페이지

- 내 소유 게임 목록 및 플레이타임 확인

---

## 기술 스택

| 영역      | 기술                                                     |
| --------- | -------------------------------------------------------- |
| Frontend  | Next.js (SSR)                                            |
| Backend   | Node.js                                                  |
| Database  | PostgreSQL                                               |
| AI        | 경량 LLM API (GPT-4o-mini / Claude Haiku / Gemini Flash) |
| 상태 관리 | TanStack Query                                           |
| 인증      | Steam OpenID                                             |
| 외부 API  | Steam Web API, YouTube Data API v3                       |

---

## 아키텍처

```
[Client - Next.js SSR]
        │
        ▼
[Node.js Backend API]
    │           │
    ▼           ▼
[PostgreSQL]  [AI API]
    │
    ▼
[48h Batch Scheduler]
    │
    ▼
[Steam Store API → DB Update]
```

**데이터 흐름:**

1. 48시간 주기 배치로 Steam 게임 데이터를 크롤링하여 DB 최신화
2. 랜딩 페이지는 DB에서 SSR로 할인/인기 게임 제공
3. AI 추천 시 백엔드에서 DB 사전 필터링 → 필터링된 후보군 + 유저 성향을 AI API에 전달 → 비용 최적화

---

## 유저 플로우

```
[비로그인 유저]
  └─ 랜딩 진입 → 할인/인기 게임 브라우징
  └─ AI 추천 클릭 → Steam 로그인 리다이렉트
        │
        ▼
[로그인 유저]
  └─ AI 추천 → 4가지 조건 선택 → 추천 결과 (Top 3 근거 + 리스트)
  └─ 게임 카드 클릭 → 상세 페이지 (정보 + YouTube 영상 + Steam 링크)
  └─ 마이페이지 → 소유 게임 + 플레이타임 확인
```

---

## 실행 방법

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# STEAM_API_KEY, DATABASE_URL, AI_API_KEY, YOUTUBE_API_KEY 설정

# DB 마이그레이션
pnpm run db:migrate

# 개발 서버 실행
pnpm dev
```

---

## 환경 변수

| 변수명            | 설명                   |
| ----------------- | ---------------------- |
| `STEAM_API_KEY`   | Steam Web API 키       |
| `DATABASE_URL`    | PostgreSQL 연결 문자열 |
| `AI_API_KEY`      | AI 모델 API 키         |
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 |
| `NEXTAUTH_SECRET` | 세션 암호화 키         |

---

## 개발 로드맵

프로젝트는 Phase 0부터 Phase 8까지 체계적으로 개발됩니다:

- **Phase 0**: 프로젝트 초기 세팅
- **Phase 1**: 데이터 파이프라인
- **Phase 2**: 인증
- **Phase 3**: 랜딩 페이지
- **Phase 4**: 게임 상세 페이지
- **Phase 5**: AI 추천 기능
- **Phase 6**: 마이페이지
- **Phase 7**: 보안 강화 & 폴리싱 & 배포
- **Phase 8**: Spring 마이그레이션

상세한 로드맵은 [개발 로드맵 문서](./docs/roadmap.md)를 참고하세요.

---

## 기여하기

프로젝트에 기여하기 전에 다음 규칙들을 확인해주세요:

- **커밋 메시지 컨벤션**: Feat, Fix, Docs, Style, Refactor, Test, Chore
- **브랜치 전략**: Git Flow (main, develop, feature/_, hotfix/_)
- **코딩 스타일**: camelCase (변수/함수), PascalCase (컴포넌트), UPPER_SNAKE_CASE (상수)
- **폴더 구조**: Feature-Sliced Design (FSD)

자세한 내용은 [프로젝트 규칙 문서](./docs/CONTRIBUTING.md)를 참고하세요.

---

## 문서

프로젝트의 상세한 기획 및 구현 내용은 다음 문서들을 참고하세요:

### 프로젝트 관리

- [프로젝트 개요](./docs/spec/overview.md)
- [개발 로드맵](./docs/roadmap.md)
- [기여 가이드](./docs/CONTRIBUTING.md)

### 시스템 설계

- [시스템 아키텍처](./docs/spec/architecture.md)
- [보안 정책](./docs/spec/security.md)
- [모니터링 전략](./docs/spec/monitoring.md)

### 기능 명세

- [AI 추천 기능](./docs/spec/features/ai-recommendation.md)
- [인증 시스템](./docs/spec/features/authentication.md)
- [데이터 파이프라인](./docs/spec/features/data-pipeline.md)

### 페이지 명세

- [랜딩 페이지](./docs/spec/pages/landing.md)
- [AI 추천 페이지](./docs/spec/pages/recommend.md)
- [게임 상세 페이지](./docs/spec/pages/game-detail.md)
- [마이페이지](./docs/spec/pages/mypage.md)

---

## 라이선스

MIT License
