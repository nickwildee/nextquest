# 개발 로드맵

## 개요

Steam Game Recommender 프로젝트의 단계별 개발 계획. Phase 0부터 Phase 8까지 체계적으로 기능을 구현하고 배포.

---

## Phase 0: 프로젝트 초기 세팅

### 목표

프로젝트 기본 구조 및 개발 환경 구축.

### 작업 항목

- [ ] Next.js 프로젝트 생성 (App Router, SSR 설정)
- [ ] PostgreSQL 로컬 환경 세팅 및 DB 스키마 설계
  - `games` 테이블: id, title, description, genres, tags, price, discount_percent, discount_end_date, review_count, positive_review_ratio, screenshots, release_date, system_requirements
  - `users` 테이블: steam_id, display_name, avatar_url, last_login, last_recommended_at
  - `user_games` 테이블: steam_id, game_id, playtime_minutes
- [ ] Node.js 백엔드 초기 세팅 (Express 또는 Next.js API Routes 결정)
- [ ] ESLint / Prettier / 프로젝트 구조(FSD) 세팅
- [ ] TanStack Query 설치 및 기본 설정
- [ ] Git 레포 생성 및 브랜치 전략 결정

**산출물**:

- 초기 프로젝트 구조
- DB 스키마 설계 문서
- 코드 컨벤션 정의

**관련 문서**:

- [데이터베이스 설계](./spec/database.md)
- [시스템 아키텍처](./spec/architecture.md)

---

## Phase 1: 데이터 파이프라인

### 목표

Steam API를 통해 게임 데이터를 수집하고 DB에 저장하는 자동화 시스템 구축.

### 작업 항목

- [ ] Steam API 키 발급 및 연동 테스트
- [ ] 게임 데이터 크롤러 구현
  - Steam Store API로 게임 목록 수집
  - 가격, 할인, 리뷰, 장르, 스크린샷, 시스템 요구사양 파싱
  - PostgreSQL에 저장
- [ ] 48시간 주기 배치 업데이트 스케줄러 구현 (node-cron 등)
- [ ] 리뷰 기준 필터링 로직 (긍정 리뷰 5,000개 이상 / 압도적 긍정적~대체로 긍정적)
- [ ] 데이터 정합성 검증 및 에러 핸들링

**산출물**:

- 게임 데이터 크롤러 스크립트
- 배치 업데이트 스케줄러
- 초기 게임 데이터 (10,000개 이상)

**관련 문서**:

- [데이터 파이프라인](./spec/features/data-pipeline.md)
- [데이터베이스 설계](./spec/database.md)

---

## Phase 2: 인증

### 목표

Steam OpenID를 통한 소셜 로그인 구현 및 유저 데이터 관리.

### 작업 항목

- [ ] Steam OpenID 로그인 구현
- [ ] Steam OpenID 콜백 검증 (openid.signed 필드 → Steam 서버 직접 검증)
- [ ] 콜백 도메인 화이트리스트 설정
- [ ] 로그인 후 Steam Web API로 유저 라이브러리 + 플레이타임 조회
- [ ] 유저 데이터 DB 저장 (users, user_games 테이블)
- [ ] 세션 관리 (7일 유지 → 자동 만료 → 재로그인)
- [ ] 비로그인 → AI 추천 클릭 시 로그인 리다이렉트 처리
- [ ] 로그인 상태에 따른 네비게이션 분기 (마이페이지 노출 여부)
- [ ] CORS 설정 (서비스 도메인만 허용, 와일드카드 금지)
- [ ] HTTPS 강제 적용 (HTTP → HTTPS 리다이렉트)

**산출물**:

- Steam OpenID 인증 시스템
- 유저 세션 관리 시스템
- 유저 라이브러리 수집 로직

**관련 문서**:

- [인증 시스템](./spec/features/authentication.md)
- [보안 정책](./spec/security.md)

---

## Phase 3: 랜딩 페이지

### 목표

비로그인/로그인 공통으로 접근 가능한 넷플릭스 스타일 메인 페이지 구현.

### 작업 항목

- [ ] 넷플릭스 스타일 레이아웃 구현
- [ ] 히어로 슬라이더 컴포넌트 (인기 할인 Top 5, 자동 슬라이드)
- [ ] 게임 카드 컴포넌트 (썸네일, 제목, 가격, 할인율, 리뷰 요약)
- [ ] 가로 스크롤 섹션 컴포넌트
- [ ] 섹션 구현
  - 압도적 긍정적 할인 게임
  - 인기 게임 (할인 무관)
  - 장르별 게임
  - 할인율 높은순
- [ ] 필터링/정렬 기능 (장르별, 인기별, 할인율순)
- [ ] SSR 적용 및 SEO 메타데이터 설정

**산출물**:

- 랜딩 페이지 컴포넌트
- 게임 카드 재사용 컴포넌트
- 반응형 레이아웃

**관련 문서**:

- [랜딩 페이지](./spec/pages/landing.md)

---

## Phase 4: 게임 상세 페이지

### 목표

개별 게임의 상세 정보를 표시하는 페이지 구현.

### 작업 항목

- [ ] 동적 라우팅 (`/game/[id]`) 설정
- [ ] 게임 기본 정보 렌더링 (제목, 설명, 장르, 출시일)
- [ ] 가격 / 할인 정보 표시
- [ ] 리뷰 요약 (긍정 비율, 총 리뷰 수) 표시
- [ ] 스크린샷 갤러리
- [ ] YouTube Data API v3 연동
  - 게임명으로 검색 → 조회수순 영상 노출
  - 또는 인기 쇼츠 임베드
- [ ] Steam 스토어 외부 링크 버튼
- [ ] SSR 적용

**산출물**:

- 게임 상세 페이지
- YouTube 영상 임베드 컴포넌트
- 스크린샷 갤러리 컴포넌트

**관련 문서**:

- [게임 상세 페이지](./spec/pages/game-detail.md)

---

## Phase 5: AI 추천 기능

### 목표

유저의 Steam 라이브러리와 선택 조건을 바탕으로 AI가 게임을 추천하는 핵심 기능 구현.

### 작업 항목

- [ ] AI API 선정 (GPT-4o-mini / Claude Haiku / Gemini Flash 비용 비교)
- [ ] AI 추천 페이지 UI 구현
  - 4가지 프리셋 선택지 UI (장르 / 가격대 / PC 사양 / 플레이타임)
  - 선택지 뒤로가기 지원
  - "추천 받기" 버튼
  - 로딩 상태 UI
- [ ] 백엔드 추천 API 구현
  - 유저 라이브러리 → 장르별 플레이타임 집계 → 성향 프로파일 생성
  - 유저 선택 조건으로 DB 사전 필터링 (AI 비용 절감)
  - 필터링된 후보군 + 성향 프로파일 → AI API 호출
  - AI 응답 파싱 (추천도 점수 + Top 3 근거)
- [ ] AI 추천 Rate Limiting 구현
  - 서버 사이드: `last_recommended_at` 체크 → 1일 1회 제한
  - 프론트: 제한 시 "다음 추천 가능 시간" 안내 표시
- [ ] 입력값 화이트리스트 검증 (프리셋 선택지 외 값 거부)
- [ ] 일반 API Rate Limiting (IP당 분당 60회)
- [ ] 추천 결과 UI 구현
  - Top 3 근거 카드 (유저 성향 + 게임 특징 매칭 이유)
  - 나머지 추천 리스트 (추천도순)
- [ ] TanStack Query 캐싱 설정 (staleTime, invalidate on 다시 추천받기)
- [ ] AI 프롬프트 튜닝 및 결과 품질 테스트

**산출물**:

- AI 추천 페이지
- AI 추천 백엔드 API
- Rate Limiting 시스템

**관련 문서**:

- [AI 추천 기능](./spec/features/ai-recommendation.md)
- [AI 추천 페이지](./spec/pages/recommend.md)

---

## Phase 6: 마이페이지

### 목표

로그인한 유저의 프로필 및 게임 라이브러리를 표시하는 페이지 구현.

### 작업 항목

- [ ] 마이페이지 (`/mypage`) 구현
- [ ] 내 소유 게임 목록 표시
- [ ] 게임별 플레이타임 표시
- [ ] SSR 적용 (로그인 필수 페이지 가드)

**산출물**:

- 마이페이지
- 게임 라이브러리 컴포넌트

**관련 문서**:

- [마이페이지](./spec/pages/mypage.md)

---

## Phase 7: 보안 강화 & 폴리싱 & 배포

### 목표

보안 검수, UX 개선, 모니터링 도구 연동, 프로덕션 배포.

### 작업 항목

#### 보안

- [ ] Parameterized Query 적용 검수 (전체 DB 쿼리 점검)
- [ ] 환경 변수 관리 (.env)

#### UI/UX

- [ ] 반응형 디자인 (모바일/태블릿 대응)
- [ ] 에러 바운더리 및 폴백 UI
- [ ] 로딩 스켈레톤 UI
- [ ] Core Web Vitals 측정 및 최적화 (LCP, FID, CLS)

#### 모니터링

- [ ] Google Analytics 4 연동
  - 커스텀 이벤트 설정: recommend_start, recommend_complete, recommend_click, game_detail_view, steam_store_click, login_click, login_success
  - 전환율 / 재방문율 추적 설정
- [ ] Microsoft Clarity 연동
  - 히트맵 / 세션 레코딩 활성화
  - 랜딩 섹션별 클릭 패턴 분석
- [ ] Sentry 연동
  - 프론트엔드 (Next.js) + 백엔드 (Node.js) 양쪽 설정
  - 외부 API (AI, Steam, YouTube) 호출 실패 에러 추적
  - Release 태깅 설정

#### 배포

- [ ] 배포 환경 세팅 (Vercel + 외부 PostgreSQL)
- [ ] README.md 작성 (포트폴리오용)

**산출물**:

- 프로덕션 배포 환경
- 모니터링 대시보드
- 포트폴리오 README

**관련 문서**:

- [보안 정책](./spec/security.md)
- [모니터링 전략](./spec/monitoring.md)

---

## Phase 8 (이후): Spring 마이그레이션

### 목표

백엔드를 Node.js에서 Java/Spring Boot로 전환하여 크로스 스택 경험 확보.

### 작업 항목

- [ ] Node.js 백엔드 → Java/Spring Boot 전환
- [ ] 동일 API 스펙 유지하며 백엔드만 교체
- [ ] 크로스 스택 경험 포트폴리오 정리

**산출물**:

- Spring Boot 백엔드
- API 스펙 문서 (Node.js ↔ Spring 호환)

**관련 문서**:

- [시스템 아키텍처](./spec/architecture.md)
- [데이터베이스 설계](./spec/database.md)

---

## 진행 상황 추적

| Phase   | 상태    | 완료율 |
| ------- | ------- | ------ |
| Phase 0 | 🔵 대기 | 0%     |
| Phase 1 | 🔵 대기 | 0%     |
| Phase 2 | 🔵 대기 | 0%     |
| Phase 3 | 🔵 대기 | 0%     |
| Phase 4 | 🔵 대기 | 0%     |
| Phase 5 | 🔵 대기 | 0%     |
| Phase 6 | 🔵 대기 | 0%     |
| Phase 7 | 🔵 대기 | 0%     |
| Phase 8 | 🔵 대기 | 0%     |

**범례**:

- 🔵 대기
- 🟡 진행 중
- 🟢 완료

---

## 예상 마일스톤

| 마일스톤          | Phase     | 설명                                  |
| ----------------- | --------- | ------------------------------------- |
| M1: MVP 완성      | Phase 0-4 | 랜딩 페이지 + 게임 상세 페이지 + 인증 |
| M2: AI 추천 출시  | Phase 5-6 | AI 추천 기능 + 마이페이지             |
| M3: 프로덕션 배포 | Phase 7   | 보안 강화 + 모니터링 + 배포           |
| M4: Spring 전환   | Phase 8   | 백엔드 마이그레이션                   |

---

## 참고 문서

- [프로젝트 개요](./spec/overview.md)
- [시스템 아키텍처](./spec/architecture.md)
- [보안 정책](./spec/security.md)
- [모니터링 전략](./spec/monitoring.md)
