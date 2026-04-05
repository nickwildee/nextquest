# Steam Game Recommender — TODO.md

## Phase 0: 프로젝트 초기 세팅

- [ ] Next.js 프로젝트 생성 (App Router, SSR 설정)
- [ ] PostgreSQL 로컬 환경 세팅 및 DB 스키마 설계
  - `games` 테이블: id, title, description, genres, tags, price, discount_percent, discount_end_date, review_count, positive_review_ratio, screenshots, release_date, system_requirements
  - `users` 테이블: steam_id, display_name, avatar_url, last_login
  - `user_games` 테이블: steam_id, game_id, playtime_minutes
- [ ] Node.js 백엔드 초기 세팅 (Express 또는 Next.js API Routes 결정)
- [ ] ESLint / Prettier / 프로젝트 구조(FSD) 세팅
- [ ] TanStack Query 설치 및 기본 설정
- [ ] Git 레포 생성 및 브랜치 전략 결정

---

## Phase 1: 데이터 파이프라인

- [ ] Steam API 키 발급 및 연동 테스트
- [ ] 게임 데이터 크롤러 구현
  - Steam Store API로 게임 목록 수집
  - 가격, 할인, 리뷰, 장르, 스크린샷, 시스템 요구사양 파싱
  - PostgreSQL에 저장
- [ ] 48시간 주기 배치 업데이트 스케줄러 구현 (node-cron 등)
- [ ] 리뷰 기준 필터링 로직 (긍정 리뷰 5,000개 이상 / 압도적 긍정적~대체로 긍정적)
- [ ] 데이터 정합성 검증 및 에러 핸들링

---

## Phase 2: 인증

- [ ] Steam OpenID 로그인 구현
- [ ] 로그인 후 Steam Web API로 유저 라이브러리 + 플레이타임 조회
- [ ] 유저 데이터 DB 저장 (users, user_games 테이블)
- [ ] 세션/토큰 관리 (로그인 상태 유지)
- [ ] 비로그인 → AI 추천 클릭 시 로그인 리다이렉트 처리
- [ ] 로그인 상태에 따른 네비게이션 분기 (마이페이지 노출 여부)

---

## Phase 3: 랜딩 페이지

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

---

## Phase 4: 게임 상세 페이지

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

---

## Phase 5: AI 추천 기능

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
- [ ] 추천 결과 UI 구현
  - Top 3 근거 카드 (유저 성향 + 게임 특징 매칭 이유)
  - 나머지 추천 리스트 (추천도순)
- [ ] TanStack Query 캐싱 설정 (staleTime, invalidate on 다시 추천받기)
- [ ] AI 프롬프트 튜닝 및 결과 품질 테스트

---

## Phase 6: 마이페이지

- [ ] 마이페이지 (`/mypage`) 구현
- [ ] 내 소유 게임 목록 표시
- [ ] 게임별 플레이타임 표시
- [ ] SSR 적용 (로그인 필수 페이지 가드)

---

## Phase 7: 폴리싱 & 배포

- [ ] 반응형 디자인 (모바일/태블릿 대응)
- [ ] 에러 바운더리 및 폴백 UI
- [ ] 로딩 스켈레톤 UI
- [ ] Core Web Vitals 측정 및 최적화 (LCP, FID, CLS)
- [ ] 배포 환경 세팅 (Vercel + 외부 PostgreSQL)
- [ ] 환경 변수 관리 (.env)
- [ ] README.md 작성 (포트폴리오용)

---

## Phase 8 (이후): Spring 마이그레이션

- [ ] Node.js 백엔드 → Java/Spring Boot 전환
- [ ] 동일 API 스펙 유지하며 백엔드만 교체
- [ ] 크로스 스택 경험 포트폴리오 정리
