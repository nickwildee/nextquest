# AI 추천 페이지 (`/recommend`)

## 개요

Steam 로그인 필수. 유저의 플레이 히스토리와 직접 선택한 조건을 AI가 분석하여 개인화된 게임 추천 제공.

---

## 인증 가드

### 비로그인 사용자

1. 네비게이션 "AI 추천" 버튼 클릭
2. `/recommend` 접근 시도
3. 미들웨어가 세션 체크
4. 세션 없음 → Steam 로그인 페이지로 리다이렉트
   - `redirect=/recommend` 파라미터 포함
5. 로그인 완료 후 다시 `/recommend`로 돌아옴

### 로그인 사용자

1. 직접 `/recommend` 페이지 접근 가능
2. 유저 라이브러리 데이터 자동 로드

---

## 유저 플로우

```
[페이지 진입]
      ↓
[선택지 화면]
  - 장르
  - 가격대
  - PC 사양
  - 플레이타임
      ↓
[추천 받기 버튼 클릭]
      ↓
[로딩 화면] (AI 분석 중...)
      ↓
[결과 화면]
  - Top 3 근거 카드
  - 나머지 추천 리스트
```

---

## 1단계: 선택지 입력 화면

### UI 구조

```
┌─────────────────────────────────────┐
│  AI 게임 추천                        │
│                                     │
│  당신의 Steam 플레이 히스토리를      │
│  바탕으로 맞춤 게임을 추천해드립니다  │
├─────────────────────────────────────┤
│                                     │
│  [1] 원하는 장르를 선택하세요        │
│   ○ FPS                             │
│   ○ RPG                             │
│   ○ 소울류                           │
│   ○ 전략                            │
│   ○ 퍼즐                            │
│   ○ 인디                            │
│                                     │
│  [2] 희망 가격대                     │
│   ○ 10,000원 이하                   │
│   ○ 20,000원 이하                   │
│   ○ 30,000원 이하                   │
│   ○ 50,000원 이하                   │
│                                     │
│  [3] PC 사양                         │
│   ○ RTX 20 시리즈                   │
│   ○ RTX 30 시리즈                   │
│   ○ RTX 40 시리즈                   │
│   ○ Mac                             │
│                                     │
│  [4] 원하는 플레이타임               │
│   ○ 50시간 이내                     │
│   ○ 50-100시간                      │
│   ○ 100시간 이상                    │
│                                     │
│  [추천 받기]  [뒤로가기]             │
└─────────────────────────────────────┘
```

### 프리셋 값

```typescript
const GENRE_OPTIONS = ['FPS', 'RPG', '소울류', '전략', '퍼즐', '인디'];

const PRICE_OPTIONS = [
  { label: '10,000원 이하', value: 10000 },
  { label: '20,000원 이하', value: 20000 },
  { label: '30,000원 이하', value: 30000 },
  { label: '50,000원 이하', value: 50000 }
];

const SPEC_OPTIONS = [
  'RTX 20 시리즈',
  'RTX 30 시리즈',
  'RTX 40 시리즈',
  'Mac'
];

const PLAYTIME_OPTIONS = [
  { label: '50시간 이내', value: '<50h' },
  { label: '50-100시간', value: '50-100h' },
  { label: '100시간 이상', value: '>100h' }
];
```

### 선택지 뒤로가기 지원

- 브라우저 뒤로가기 시 선택 상태 유지 (React state + URL query params)
- `?genre=FPS&price=20000&spec=RTX30&playtime=50-100h`

---

## 2단계: 로딩 화면

### UI 디자인

```
┌─────────────────────────────────────┐
│                                     │
│         [로딩 애니메이션]            │
│                                     │
│     AI가 당신의 게임을 분석 중...    │
│                                     │
│  • 플레이 히스토리 분석             │
│  • 선호 장르 파악                   │
│  • 최적의 게임 선정                 │
│                                     │
└─────────────────────────────────────┘
```

### 타임아웃 설정

- **최대 대기 시간**: 30초
- 30초 초과 시:
  - 에러 메시지 표시: "AI 분석에 실패했습니다. 다시 시도해주세요."
  - "다시 시도" 버튼 제공

---

## 3단계: 결과 화면

### Top 3 근거 카드

```
┌────────────────────────────────────────────┐
│  🏆 당신을 위한 추천 Top 3                   │
├────────────────────────────────────────────┤
│                                            │
│  1. [게임 제목]                ★ 95점      │
│     [썸네일 이미지]                         │
│                                            │
│     💡 추천 이유:                           │
│     "당신이 300시간 플레이한 DOOM Eternal과 │
│      유사한 빠른 FPS 액션. 최적화가 끠 되어 │
│      RTX 30 시리즈에서 고프레임 가능"       │
│                                            │
│     가격: ₩15,000 (-50%)                   │
│     리뷰: 👍 95% (50,000개)                │
│                                            │
│     [Steam에서 보기]  [상세 정보]           │
│                                            │
├────────────────────────────────────────────┤
│  2. [게임 제목 2]              ★ 92점      │
│  ...                                       │
└────────────────────────────────────────────┘
```

### 나머지 추천 리스트

```
┌────────────────────────────────────────────┐
│  기타 추천 게임                             │
├────────────────────────────────────────────┤
│                                            │
│  4. [게임명]    ★ 88점   ₩20,000  👍 90%  │
│  5. [게임명]    ★ 85점   ₩18,000  👍 87%  │
│  6. [게임명]    ★ 83점   ₩25,000  👍 92%  │
│  ...                                       │
│                                            │
└────────────────────────────────────────────┘
```

### 액션 버튼

- **Steam에서 보기**: Steam 스토어 외부 링크 (새 탭)
- **상세 정보**: `/game/[id]` 내부 링크
- **다시 추천받기**: 선택지 화면으로 돌아가기 (캐시 invalidate)

---

## 캐싱 전략

### TanStack Query 설정

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['recommendation', userId, preferences],
  queryFn: () => fetchRecommendation(preferences),
  staleTime: Infinity, // 명시적 invalidate 전까지 유지
  gcTime: 1000 * 60 * 60, // 1시간
  retry: 1, // AI API 실패 시 1회만 재시도
});
```

### "다시 추천받기" 처리

```typescript
const queryClient = useQueryClient();

function handleRetry() {
  queryClient.invalidateQueries(['recommendation', userId]);
  router.push('/recommend'); // 선택지 화면으로
}
```

### 페이지 이동 후 재진입

- 캐시된 결과 즉시 표시
- 사용자 경험 개선 (재로딩 없음)

---

## Rate Limiting 안내

### 1일 1회 제한 초과 시

```
┌─────────────────────────────────────┐
│  ⚠️ 일일 추천 횟수 초과               │
│                                     │
│  AI 추천은 하루에 1번만 가능합니다.   │
│                                     │
│  다음 추천 가능 시간:                 │
│  2025-01-16 10:30 (5시간 후)        │
│                                     │
│  [이전 추천 결과 보기]               │
└─────────────────────────────────────┘
```

### 구현

```typescript
// 서버 응답
{
  "error": "RATE_LIMIT_EXCEEDED",
  "next_available_at": "2025-01-16T10:30:00Z",
  "cached_result": {...} // 이전 추천 결과
}

// 프론트엔드 처리
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  showRateLimitModal({
    nextAvailableAt: error.next_available_at,
    cachedResult: error.cached_result
  });
}
```

---

## 에러 처리

| 에러 상황 | 메시지 | 액션 |
|-----------|--------|------|
| AI API 타임아웃 | "AI 분석에 실패했습니다" | "다시 시도" 버튼 |
| Rate Limit 초과 | "일일 추천 횟수 초과" | 다음 가능 시간 표시 + 이전 결과 보기 |
| Steam 라이브러리 조회 실패 | "게임 라이브러리를 불러올 수 없습니다" | "재로그인" 버튼 |
| 네트워크 오류 | "연결에 실패했습니다" | "다시 시도" 버튼 |

---

## GA4 이벤트 추적

```typescript
// 추천 시작
gtag('event', 'recommend_start', {
  genre: selectedGenre,
  price_range: selectedPrice,
  pc_spec: selectedSpec,
  playtime: selectedPlaytime
});

// 추천 완료
gtag('event', 'recommend_complete', {
  result_count: recommendations.length,
  duration_ms: elapsed
});

// 추천 결과 클릭
gtag('event', 'recommend_click', {
  game_id: gameId,
  rank: index + 1,
  score: game.score
});
```

---

## 관련 문서

- [AI 추천 로직](../features/ai-recommendation.md)
- [인증 시스템](../features/authentication.md)
- [보안 정책](../security.md)
- [게임 상세 페이지](./game-detail.md)
