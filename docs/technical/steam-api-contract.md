# Steam API 응답과 fixture 계약

> 외부 응답 확인일: 2026-09-15 (Asia/Seoul)

## 목적

Steam 연동을 구현하기 전에 공식 문서와 실제 응답의 경계를 고정한다. 외부 API 모양을 그대로 제품 도메인에 퍼뜨리지 않고, 실제 응답을 검증하는 스키마와 NextQuest가 사용하는 정규화 모델 사이에 mapper를 둔다.

내부 프로토타입은 이 계약을 닮은 fixture를 사용하지만 Steam에 요청하지 않는다.

## 확인 순서

데이터 계약은 다음 순서로 만든다.

```text
공식 문서 확인
→ 개인정보를 출력하지 않는 실제 응답 확인
→ 필요한 필드 선택
→ 외부 응답 스키마 작성
→ 도메인 mapper 작성
→ raw-shaped 합성 fixture 작성
→ 정규화된 도메인 fixture 작성
→ 계약·mapper 테스트
```

실제 응답 전체를 fixture로 복사하지 않는다. 외부 응답 형태를 재현하는 fixture와 화면·도메인에서 사용하는 fixture를 분리한다.

## 리뷰 목록 API

### 공식 엔드포인트

```http
GET https://store.steampowered.com/appreviews/<appid>?json=1
```

[Steamworks: User Reviews - Get List](https://partner.steamgames.com/doc/store/getreviews?l=english)에 공개된 엔드포인트다. API 키 없이 호출할 수 있다.

### 주요 요청 조건

| 파라미터 | 역할 |
| --- | --- |
| `filter` | 최근 작성, 최근 수정 또는 전체 범위의 정렬·조회 방식 |
| `language` | Steam 리뷰 언어 코드 또는 모든 언어 |
| `day_range` | 조회 기간 |
| `cursor` | 다음 페이지를 가져오는 커서 |
| `review_type` | 전체, 긍정 또는 부정 리뷰 |
| `purchase_type` | Steam 구매 또는 전체 구매 유형 |
| `num_per_page` | 한 페이지의 리뷰 수, 최대 100개 |
| `filter_offtopic_activity` | Steam이 비정상적 리뷰 활동으로 분류한 기간 포함 여부 |

전체 모수와 표본을 비교하려면 요청 조건을 결과와 함께 저장해야 한다. 조건이 다르면 `total_reviews`도 다른 모집단을 의미한다.

### 첫 페이지 요약

첫 요청의 `query_summary`에는 다음 필드가 들어온다.

```json
{
  "num_reviews": 1,
  "review_score": 8,
  "review_score_desc": "Very Positive",
  "total_positive": 25520,
  "total_negative": 2378,
  "total_reviews": 27898
}
```

위 값은 2026-09-15에 `ELDEN RING`, `language=koreana`, `filter=recent`, `review_type=all`, `purchase_type=all`, `num_per_page=1`로 확인한 시점성 있는 예시다. 수치는 fixture 기본값이나 제품 상수로 사용하지 않는다.

- `num_reviews`: 현재 응답에 포함된 리뷰 수
- `total_positive`: 요청 조건에 맞는 긍정 리뷰 총수
- `total_negative`: 요청 조건에 맞는 부정 리뷰 총수
- `total_reviews`: 요청 조건에 맞는 전체 리뷰 수
- `cursor`: 다음 페이지 요청에 사용할 문자열

### 실제 리뷰 객체에서 확인한 필드

2026-09-15 공개 응답에서 다음 필드를 확인했다.

```text
recommendationid
language
review
timestamp_created
timestamp_updated
voted_up
votes_up
votes_funny
weighted_vote_score
comment_count
steam_purchase
received_for_free
written_during_early_access
refunded
primarily_steam_deck
author.playtime_at_review
author.playtime_forever
author.playtime_last_two_weeks
author.last_played
```

응답에는 `author.steamid`, 사용자 이름, 프로필 URL과 아바타처럼 NextQuest 분석에 필요하지 않은 개인 식별 필드도 포함될 수 있다. 이 필드는 mapper 입력 단계에서 버리고 로그, fixture와 저장소에 남기지 않는다.

### NextQuest가 보관할 최소 리뷰 모델

```ts
type NormalizedReview = {
  sourceReviewId: string;
  gameId: string;
  language: string;
  originalText: string;
  votedUp: boolean;
  createdAt: number;
  updatedAt: number;
  playtimeAtReviewMinutes?: number;
  helpfulVotes: number;
  receivedForFree: boolean;
  writtenDuringEarlyAccess: boolean;
};
```

이 타입은 구현 전 계약 초안이다. 실제 Zod 스키마는 Issue #12에서 정의하며, 외부 응답에 필드가 추가돼도 선택한 필드 외에는 도메인으로 전달하지 않는다.

## 보유 게임 API

[Steamworks: IPlayerService.GetOwnedGames](https://partner.steamgames.com/doc/webapi/IPlayerService?language=english#GetOwnedGames)로 공개 라이브러리의 게임과 플레이 시간을 요청할 수 있다.

- API 키와 Steam ID가 필요하다.
- 라이브러리 공개 범위에 따라 결과를 받을 수 없을 수 있다.
- `include_appinfo`를 사용하면 이름과 아이콘 정보를 함께 요청할 수 있다.
- API 키는 브라우저 코드, 로그, 문서와 fixture에 포함하지 않고 서버 환경에서만 사용한다.

내부 프로토타입에서는 실제 계정으로 호출하지 않는다. 운영 연동을 시작할 때 테스트 전용 공개 계정과 서버 보관 키를 준비하고, 개인정보를 제거한 필드 목록만 문서에 추가한다.

## 상점 앱 목록과 상세 정보

[Steamworks: IStoreService.GetAppList](https://partner.steamgames.com/doc/webapi/IStoreService?l=english#GetAppList)는 앱 목록을 페이지 단위로 제공한다. 내부 프로토타입은 검수된 App ID를 fixture에 직접 보관하므로 전체 앱 목록을 받을 필요가 없다.

2026-09-15에 공개 상점의 `api/appdetails` 응답을 `ELDEN RING`으로 확인했을 때 다음 정보는 있었지만 `tags` 필드는 없었다.

- `steam_appid`, `name`, `type`
- `genres`, `categories`
- `supported_languages`
- `release_date`, `platforms`
- 상점 설명, 이미지, 가격과 패키지 관련 필드

`api/appdetails`는 이 문서에서 안정적인 공식 계약으로 간주하지 않는다. 구현 시 공식 지원 여부와 응답 변화를 다시 확인하고, 필요한 필드만 방어적으로 검증한다.

## Steam 태그

[Steamworks: Steam Tags](https://partner.steamgames.com/doc/store/tags)는 태그가 사용자와 개발자에 의해 바뀔 수 있고 상점의 유사 게임 판단 등에 사용된다고 설명한다. 그러나 검토 시점에는 NextQuest가 의존할 수 있는 안정적인 공개 태그 응답 필드를 공식 문서와 상점 상세 응답에서 확인하지 못했다.

따라서 다음 정책을 사용한다.

- 내부 프로토타입의 태그는 사람이 검수해 fixture에 기록한다.
- 태그 유사성은 작고 상한이 있는 가점으로만 사용한다.
- 태그 부재와 차이는 감점하지 않는다.
- 공개 태그 수집 경로가 공식적으로 확인되기 전에는 자동화하지 않는다.

## 외부 응답 fixture와 도메인 fixture

### raw-shaped fixture

외부 API의 형태와 실패를 검증한다.

- `query_summary`가 있는 첫 페이지
- `cursor`가 있는 다음 페이지
- 빈 `reviews`
- 선택 필드 누락과 타입 오류
- API 성공·실패 상태

모든 값은 합성하며 실제 Steam ID와 리뷰 원문을 넣지 않는다.

### domain fixture

제품 규칙과 화면을 검증한다.

- 검수된 게임 정보
- 정규화된 리뷰와 문장 ID
- 경험 요소와 특성 ID
- 긍정·부정·혼합 claim
- 원문 근거 범위와 검수된 번역
- `맞을 근거`, `주의 신호`, `판단 불가` 사례

정상 제품 흐름에서 실제 리뷰를 사용할 때는 테스트 fixture와 분리하고, 출처·수집 시점·이용 조건을 검수한 최소 문장만 보관한다.

## 계약 검증

구현 시 다음을 자동 테스트한다.

1. 외부 응답 스키마가 확인한 공개 응답 형태를 허용한다.
2. 필요한 필드가 누락되거나 타입이 다르면 명시적으로 실패한다.
3. mapper가 개인 식별 필드를 도메인 모델로 전달하지 않는다.
4. 첫 페이지의 전체 모수와 실제로 분석한 리뷰 수를 구분한다.
5. 동일한 `recommendationid`와 원문 해시를 사용해 중복·수정 리뷰를 판별한다.
6. fixture가 외부 서비스, 현재 시각과 실행 순서에 의존하지 않는다.
7. API 응답이 바뀌어도 제품 도메인과 UI가 외부 필드를 직접 참조하지 않는다.

## 구현 전 재확인 사항

- API별 이용 조건과 저장 가능한 리뷰 원문 범위
- `api/appdetails`를 사용할지 공식 API 조합으로 대체할지
- 운영 Steam 연동의 서버 경계와 키 보관 방식
- 리뷰의 새 글·수정 여부를 확인하는 페이지 순회 전략
- 공식 태그 데이터 접근 경로의 존재 여부

## 관련 문서

- [MVP 범위](../product/scope.md)
- [리뷰 분석 정책](../product/review-analysis.md)
- [개발 계획](../product/development-plan.md)
