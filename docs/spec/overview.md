# 프로젝트 개요

## 서비스 소개

AI 기반 Steam 게임 추천 + 할인 게임 브라우징 서비스.

유저의 Steam 라이브러리(플레이타임, 장르)와 직접 선택한 조건을 조합하여 개인화된 게임을 추천하고, 비로그인 유저에게도 할인/인기 게임 탐색 기능을 제공한다.

---

## 타겟 유저

| 유저 유형 | 진입 동기 |
|-----------|-----------|
| 라이트 유저 | 스트리머 영상 또는 과거 플레이 경험으로 "비슷한 게임 없나?" 탐색 |
| 할인 게임 헌터 | 눈여겨봤던 게임 할인 여부 확인, 할인 목록에서 괜찮은 게임 발굴 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js (SSR 중심) |
| Backend | Node.js (1차) → Java/Spring 마이그레이션 (2차) |
| Database | PostgreSQL |
| AI | 경량 API 모델 (GPT-4o-mini / Claude Haiku / Gemini Flash 중 비용 비교 후 확정) |
| 상태 관리 | TanStack Query (추천 결과 캐싱 포함) |
| 인증 | Steam OpenID |
| 외부 API | Steam Web API, YouTube Data API v3 |

---

## 네비게이션 구조

```
[로고/홈] [AI 추천] [마이페이지(로그인 후)] [Steam 로그인/프로필]
```

- **AI 추천**: 항상 노출, 비로그인 시 로그인으로 리다이렉트
- **마이페이지**: 로그인 후에만 노출

---

## 관련 문서

- [시스템 아키텍처](./architecture.md)
- [데이터베이스 설계](./database.md)
- [보안 정책](./security.md)
- [모니터링 전략](./monitoring.md)
- [개발 로드맵](../roadmap.md)
