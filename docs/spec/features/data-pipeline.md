# 데이터 파이프라인

## 개요

Steam API를 통해 게임 데이터를 수집하고, PostgreSQL에 저장하여 서비스에서 활용. 48시간 주기로 자동 업데이트하여 최신 가격, 할인, 리뷰 정보 유지.

---

## 데이터 수집 플로우

```
[Steam Store API]
      ↓
[게임 목록 조회] → [GetAppList]
      ↓
[각 게임 상세 정보 조회] → [appdetails API]
      ↓
[데이터 파싱 & 검증]
      ↓
[PostgreSQL 저장/업데이트]
      ↓
[48시간 후 반복]
```

---

## Steam API 엔드포인트

### 1. 게임 목록 조회

```
GET https://api.steampowered.com/ISteamApps/GetAppList/v2/
```

**응답**:

```json
{
  "applist": {
    "apps": [
      { "appid": 570, "name": "Dota 2" },
      { "appid": 730, "name": "Counter-Strike 2" }
    ]
  }
}
```

### 2. 게임 상세 정보 조회

```
GET https://store.steampowered.com/api/appdetails?appids=[APP_ID]&cc=kr&l=korean
```

**파라미터**:

- `appids`: 게임 ID
- `cc=kr`: 한국 가격 정보
- `l=korean`: 한국어 설명

**수집 항목**:

```json
{
  "type": "game",
  "name": "게임 제목",
  "short_description": "짧은 설명",
  "detailed_description": "상세 설명",
  "genres": [{ "id": "1", "description": "Action" }],
  "categories": [{ "id": 1, "description": "Multi-player" }],
  "price_overview": {
    "final": 15000,
    "discount_percent": 50,
    "initial": 30000
  },
  "release_date": { "date": "2023-01-15" },
  "screenshots": [{ "path_full": "https://..." }],
  "movies": [{ "webm": { "480": "https://..." } }],
  "recommendations": { "total": 125000 },
  "pc_requirements": {
    "minimum": "OS: Windows 10...",
    "recommended": "OS: Windows 11..."
  }
}
```

---

## 수집 항목 상세

| 항목            | 필드명                          | 타입      | 용도                |
| --------------- | ------------------------------- | --------- | ------------------- |
| 게임 ID         | appid                           | integer   | Primary Key         |
| 제목            | name                            | string    | 게임명 표시         |
| 설명            | short_description               | text      | 카드 미리보기       |
| 장르            | genres                          | json      | 필터링, AI 추천     |
| 태그            | categories                      | json      | 세부 필터링         |
| 가격            | price_overview.final            | integer   | 필터링, 표시 (원화) |
| 할인율          | price_overview.discount_percent | integer   | 할인 섹션 필터링    |
| 할인 종료일     | N/A (추가 계산 필요)            | timestamp | 할인 종료 임박 표시 |
| 리뷰 수         | recommendations.total           | integer   | 인기도 지표         |
| 긍정 리뷰 비율  | N/A (Steam Reviews API)         | float     | 품질 지표           |
| 스크린샷        | screenshots                     | json      | 상세 페이지 갤러리  |
| 출시일          | release_date.date               | date      | 필터링, 정렬        |
| 시스템 요구사양 | pc_requirements                 | json      | PC 사양 필터링      |

---

## 리뷰 데이터 수집

Steam Store API는 리뷰 통계를 제공하지 않으므로, 별도 엔드포인트 사용:

```
GET https://store.steampowered.com/appreviews/[APP_ID]?json=1&language=all&purchase_type=all
```

**수집**:

```json
{
  "query_summary": {
    "total_positive": 85000,
    "total_negative": 5000,
    "total_reviews": 90000,
    "review_score": 9,
    "review_score_desc": "압도적으로 긍정적"
  }
}
```

**긍정 비율 계산**:

```
positive_ratio = total_positive / total_reviews
```

---

## 배치 업데이트 스케줄러

### 구현 방식

**Phase 1 (Node.js)**:

```javascript
import cron from 'node-cron';

// 48시간마다 실행 (매주 월요일/목요일 새벽 3시)
cron.schedule('0 3 * * 1,4', async () => {
  console.log('Starting game data update...');
  await updateAllGames();
});
```

**Phase 2 (Spring)**:

```java
@Scheduled(cron = "0 0 3 * * MON,THU")
public void updateGameData() {
    gameDataService.updateAllGames();
}
```

### 업데이트 로직

1. DB에서 전체 게임 목록 조회
2. 각 게임에 대해 Steam API 호출 (Rate Limit 고려)
3. 변경된 데이터만 업데이트 (가격, 할인, 리뷰)
4. 신규 게임 추가
5. 더 이상 존재하지 않는 게임 비활성화 처리

```sql
-- 업데이트 쿼리
UPDATE games
SET
  price = ?,
  discount_percent = ?,
  review_count = ?,
  positive_review_ratio = ?,
  updated_at = NOW()
WHERE appid = ?;
```

---

## Rate Limiting 대응

### Steam API 제한

- **공식 제한**: 명시되지 않음, 일반적으로 초당 200회로 알려짐
- **안전한 전략**: 초당 10회 (100ms 간격)

### 구현

```javascript
import pLimit from 'p-limit';

const limit = pLimit(10); // 동시 10개 요청

const games = await getAllGames();
const promises = games.map(game => limit(() => fetchGameDetails(game.appid)));

await Promise.all(promises);
```

---

## 데이터 정합성 검증

### 1. 필수 필드 검증

```javascript
function validateGameData(data) {
  const required = ['name', 'type', 'short_description'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // type이 'game'이 아닌 경우 (DLC, bundle 등) 제외
  if (data.type !== 'game') {
    return false;
  }

  return true;
}
```

### 2. 가격 데이터 검증

```javascript
// 무료 게임 처리
if (!data.price_overview) {
  game.price = 0;
  game.discount_percent = 0;
} else {
  game.price = data.price_overview.final;
  game.discount_percent = data.price_overview.discount_percent || 0;
}
```

### 3. 에러 핸들링

| 에러 상황       | 처리 방법                                   |
| --------------- | ------------------------------------------- |
| API 타임아웃    | 지수 백오프로 3회 재시도 후 스킵, 로그 기록 |
| 잘못된 JSON     | 스킵, 에러 로그                             |
| 404 (게임 없음) | DB에서 비활성화 처리                        |
| Rate Limit 초과 | 지수 백오프 적용 (10초 → 20초 → 40초)       |

#### 지수 백오프 재시도 로직

```javascript
async function fetchWithRetry(appid, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchGameDetails(appid);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        logger.error(`Failed after ${maxRetries} attempts: ${appid}`);
        throw error;
      }

      // 지수 백오프: 2^attempt * 1000ms
      const baseDelay = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초

      // Rate Limit(429)의 경우 더 긴 대기
      const isRateLimit = error.status === 429;
      const waitTime = isRateLimit ? baseDelay * 10 : baseDelay;

      logger.warn(`Retry ${attempt + 1}/${maxRetries} for ${appid} after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}
```

**재시도 간격**:

- 일반 에러: 1초 → 2초 → 4초
- Rate Limit: 10초 → 20초 → 40초

---

## 필터링 로직

### 압도적 긍정적 할인 게임 섹션

```sql
SELECT * FROM games
WHERE
  discount_percent > 0                   -- 현재 할인 중
  AND review_count >= 5000               -- 리뷰 5,000개 이상
  AND positive_review_ratio >= 0.80      -- 긍정 비율 80% 이상
ORDER BY discount_percent DESC, positive_review_ratio DESC
LIMIT 20;
```

### 인기 게임 섹션 (할인 무관)

```sql
SELECT * FROM games
WHERE
  review_count >= 5000
  AND positive_review_ratio >= 0.80
ORDER BY review_count DESC
LIMIT 20;
```

---

## 성능 최적화

### 인덱스 전략

```sql
-- 할인 게임 조회 최적화
CREATE INDEX idx_games_discount ON games(discount_percent DESC)
WHERE discount_percent > 0;

-- 리뷰 기반 인기 게임 조회
CREATE INDEX idx_games_reviews ON games(review_count DESC, positive_review_ratio DESC)
WHERE review_count >= 5000;

-- 장르 필터링
CREATE INDEX idx_games_genres ON games USING GIN(genres);
```

### 캐싱

- 랜딩 섹션 데이터: 서버 메모리에 30분 캐싱
- DB 조회 결과를 캐싱하여 반복 요청 최적화

---

## 모니터링

### 배치 작업 로그

```javascript
{
  "batch_id": "2025-01-15-03:00",
  "started_at": "2025-01-15T03:00:00Z",
  "completed_at": "2025-01-15T05:30:00Z",
  "total_games": 150000,
  "updated": 148500,
  "added": 1200,
  "failed": 300,
  "errors": [
    {"appid": 12345, "error": "Timeout after 3 retries"}
  ]
}
```

### Sentry 알림

- 배치 작업 실패 시 Sentry로 에러 전송
- 실패율 10% 초과 시 긴급 알림

---

## 관련 문서

- [데이터베이스 설계](../database.md)
- [시스템 아키텍처](../architecture.md)
- [모니터링 전략](../monitoring.md)
