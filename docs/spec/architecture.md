# 시스템 아키텍처

## 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                    │
│                      Next.js (SSR)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend API Layer                     │
│            Node.js (Phase 1) / Spring (Phase 2)         │
├─────────────────────────────────────────────────────────┤
│  - REST API Endpoints                                   │
│  - Authentication (Steam OpenID)                        │
│  - Rate Limiting                                        │
│  - AI Recommendation Engine                             │
└──────┬──────────────────────┬──────────────────────┬────┘
       │                      │                      │
       ↓                      ↓                      ↓
┌─────────────┐      ┌────────────────┐    ┌──────────────┐
│ PostgreSQL  │      │  External APIs │    │  AI API      │
│   Database  │      │  - Steam API   │    │  - GPT/Claude│
│             │      │  - YouTube API │    │  - Gemini    │
└─────────────┘      └────────────────┘    └──────────────┘
```

---

## 프론트엔드 구조

### Next.js App Router

- **SSR 중심 렌더링**: SEO 최적화 및 초기 로딩 성능 개선
- **페이지 구조**:
  - `/` - 랜딩 페이지 (공개)
  - `/recommend` - AI 추천 페이지 (인증 필요)
  - `/game/[id]` - 게임 상세 페이지 (공개)
  - `/mypage` - 마이페이지 (인증 필요)

### 상태 관리 전략

**TanStack Query 사용**

- **서버 상태 관리**: 게임 목록, 추천 결과 등 서버 데이터
- **캐싱 전략**:
  - 게임 목록: `staleTime: 30분` (자주 변하지 않음)
  - 추천 결과: `staleTime: Infinity` (명시적 invalidate 전까지 유지)
  - 게임 상세: `staleTime: 1시간`
- **낙관적 업데이트**: 없음 (읽기 중심 서비스)

---

## 백엔드 구조

### API 엔드포인트 설계

```
GET    /api/games                 # 게임 목록 조회 (필터링, 정렬)
GET    /api/games/:id             # 게임 상세 조회
GET    /api/games/featured        # 특정 섹션용 게임 (할인, 인기 등)

POST   /api/auth/steam/login      # Steam OpenID 로그인 시작
GET    /api/auth/steam/callback   # Steam OpenID 콜백
POST   /api/auth/logout           # 로그아웃
GET    /api/auth/me               # 현재 유저 정보

GET    /api/user/library          # 유저 게임 라이브러리
GET    /api/user/profile          # 유저 프로필

POST   /api/recommend             # AI 추천 요청
GET    /api/recommend/cache       # 캐시된 추천 결과 조회
```

### 데이터 플로우

#### 1. 게임 데이터 수집 플로우

```
[Steam API] → [Crawler] → [Data Validation] → [PostgreSQL]
                ↓
         [48h 주기 배치]
```

#### 2. AI 추천 플로우

```
[User Input] → [Backend API]
                    ↓
            [User Library 분석]
                    ↓
            [DB에서 후보군 필터링]
                    ↓
            [AI API 호출]
                    ↓
            [결과 파싱 & 저장]
                    ↓
            [Frontend에 반환]
```

---

## 캐싱 전략

### 프론트엔드 캐싱 (TanStack Query)

| 데이터 타입     | staleTime | gcTime | 목적                                       |
| --------------- | --------- | ------ | ------------------------------------------ |
| 게임 목록       | 30분      | 1시간  | 자주 변하지 않는 데이터                    |
| 추천 결과       | Infinity  | 1시간  | 유저가 명시적으로 새로고침하기 전까지 유지 |
| 게임 상세       | 1시간     | 2시간  | 가격/할인 정보 최신화                      |
| 유저 라이브러리 | 1시간     | 2시간  | Steam API 호출 최소화                      |

### 백엔드 캐싱

- **게임 데이터**: PostgreSQL에 48시간 주기로 업데이트
- **추천 결과**: 세션별로 임시 저장 (1시간 TTL)
- **유저 라이브러리**: 로그인 시 1회 조회 후 세션 유지

---

## 스케일링 고려사항

### Phase 1 (Node.js)

- 단일 서버 운영
- Vercel Serverless Functions 활용

### Phase 2 (Spring 마이그레이션 시)

- 수평 확장 가능한 구조
- Load Balancer 도입 고려
- Redis 도입 (세션 스토어, 캐싱 레이어)

---

## 관련 문서

- [AI 추천 로직](./features/ai-recommendation.md)
- [인증 플로우](./features/authentication.md)
- [데이터 파이프라인](./features/data-pipeline.md)
