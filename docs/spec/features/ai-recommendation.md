# AI 추천 기능

## 개요

유저의 Steam 라이브러리 데이터와 직접 선택한 조건을 결합하여 개인화된 게임 추천을 제공하는 핵심 기능.

---

## AI 추천 로직

### 1. 유저 성향 프로파일 생성

유저 라이브러리에서 장르별 플레이타임을 집계하여 성향 프로파일 생성:

```javascript
{
  "user_profile": {
    "top_genres": [
      {"genre": "FPS", "playtime_hours": 450},
      {"genre": "RPG", "playtime_hours": 320},
      {"genre": "Strategy", "playtime_hours": 180}
    ],
    "total_games": 87,
    "total_playtime_hours": 1250
  }
}
```

### 2. 후보군 필터링 (백엔드)

유저가 선택한 4가지 조건으로 DB에서 사전 필터링:

- **장르**: 선택한 장르와 일치하는 게임
- **가격대**: 선택한 가격 범위 내 게임
- **PC 사양**: 시스템 요구사양이 선택한 사양 이하인 게임
- **플레이타임**: 평균 플레이타임이 원하는 범위 내인 게임

**목적**: AI API 비용 절감 (토큰 수 최소화)

### 3. AI API 호출

필터링된 후보군(최대 50개)과 유저 성향 프로파일을 AI에 전달:

```json
{
  "user_profile": {...},
  "user_preferences": {
    "genre": "FPS",
    "max_price": 20000,
    "pc_spec": "RTX 30 series",
    "playtime": "50-100 hours"
  },
  "candidate_games": [...]
}
```

### 4. AI 응답 파싱

AI가 반환하는 데이터 구조:

```json
{
  "top_3": [
    {
      "game_id": 12345,
      "score": 0.95,
      "reasoning": "유저가 300시간 이상 플레이한 DOOM Eternal과 유사한 빠른 FPS 액션. 최적화가 잘 되어 RTX 30 시리즈에서 고프레임 플레이 가능."
    }
  ],
  "other_recommendations": [
    {"game_id": 67890, "score": 0.88},
    {"game_id": 11223, "score": 0.85}
  ]
}
```

---

## AI 모델 선정 기준

| 모델 | 장점 | 단점 | 예상 비용 |
|------|------|------|-----------|
| GPT-4o-mini | 높은 정확도, 한글 지원 우수 | 상대적 고비용 | $0.150 / 1M tokens |
| Claude Haiku | 빠른 응답 속도, 비용 효율적 | 한글 품질 테스트 필요 | $0.25 / 1M tokens (input) |
| Gemini Flash | 무료 할당량, 빠른 속도 | 정확도 검증 필요 | 무료 15 RPM |

**최종 결정**: Phase 5 구현 시 3가지 모델 테스트 후 비용 대비 품질 기준으로 확정

---

## 프롬프트 구조 (초안)

```
당신은 Steam 게임 추천 전문가입니다.

유저의 플레이 히스토리:
- 가장 많이 플레이한 장르: [장르]
- 총 플레이타임: [시간]
- 최근 플레이한 게임: [게임 목록]

유저가 원하는 조건:
- 장르: [선택 장르]
- 최대 가격: [금액]
- PC 사양: [사양]
- 희망 플레이타임: [범위]

후보 게임 목록:
[JSON 게임 데이터]

위 정보를 바탕으로:
1. 유저 성향에 가장 잘 맞는 게임 3개를 선정하고, 각각 추천 이유를 2-3문장으로 작성하세요.
2. 나머지 게임들을 추천도 점수(0-1)와 함께 정렬하세요.

응답 형식은 JSON으로 출력하세요: {...}
```

---

## Rate Limiting

### AI 추천 제한

- **제한**: 1일 1회 (Steam ID 기준)
- **검증 위치**: 백엔드 (프론트 우회 방지)
- **구현 방법**: `users.last_recommended_at` 컬럼 체크
- **초과 시 처리**: 다음 추천 가능 시간 안내 메시지 반환

```sql
-- 추천 가능 여부 확인
SELECT
  CASE
    WHEN last_recommended_at IS NULL
      OR last_recommended_at < NOW() - INTERVAL '24 hours'
    THEN true
    ELSE false
  END as can_recommend,
  last_recommended_at + INTERVAL '24 hours' as next_available_at
FROM users
WHERE steam_id = ?;
```

---

## 입력값 검증

프리셋 선택지지만 API 레벨에서 화이트리스트 검증 필수:

```javascript
const ALLOWED_VALUES = {
  genre: ['FPS', 'RPG', 'Strategy', 'Puzzle', 'Souls-like', 'Indie'],
  price: [10000, 20000, 30000, 50000],
  pc_spec: ['RTX 20 series', 'RTX 30 series', 'RTX 40 series', 'Mac'],
  playtime: ['<50h', '50-100h', '>100h']
};

// 검증 실패 시 400 Bad Request 반환
```

---

## 캐싱 전략

### 프론트엔드 (TanStack Query)

```javascript
const { data } = useQuery({
  queryKey: ['recommendation', userId, preferences],
  queryFn: fetchRecommendation,
  staleTime: Infinity, // 명시적 invalidate 전까지 유지
  gcTime: 1000 * 60 * 60, // 1시간 후 메모리에서 제거
});

// "다시 추천받기" 버튼 클릭 시
queryClient.invalidateQueries(['recommendation', userId]);
```

### 백엔드

- 추천 결과를 세션 스토어에 임시 저장 (1시간 TTL)
- 동일한 요청 재시도 시 캐시 반환 (네트워크 오류 대응)

---

## 에러 처리

| 에러 상황 | HTTP 코드 | 처리 방법 |
|-----------|-----------|-----------|
| AI API 타임아웃 | 504 | 재시도 안내 메시지 표시 |
| Rate Limit 초과 | 429 | 다음 가능 시간 표시 |
| 잘못된 입력값 | 400 | 유효한 선택지 안내 |
| Steam 라이브러리 조회 실패 | 500 | 재로그인 안내 |

---

## 관련 문서

- [AI 추천 페이지 명세](../pages/recommend.md)
- [보안 정책](../security.md)
- [시스템 아키텍처](../architecture.md)
