# 랜딩 페이지 (`/`)

## 개요

비로그인/로그인 공통으로 접근 가능한 메인 페이지. 넷플릭스 스타일의 가로 스크롤 레이아웃으로 할인 게임과 인기 게임을 섹션별로 표시.

---

## 페이지 구조 (위→아래)

### 1. 히어로 슬라이더

**목적**: 시선 집중, 주요 할인 게임 홍보

**콘텐츠**:

- 인기 할인 게임 Top 5
- 대형 배너 (전체 너비, 높이 60vh)
- 자동 슬라이드 (5초 간격)

**표시 정보**:

- 배경: 게임 스크린샷 (어둡게 오버레이)
- 전면:
  - 게임 제목 (큰 폰트)
  - 짧은 설명 (1줄)
  - 가격 + 할인율 (강조)
  - "자세히 보기" 버튼 → `/game/[id]`

**데이터 쿼리**:

```sql
SELECT * FROM games
WHERE discount_percent > 0
  AND review_count >= 10000
  AND positive_review_ratio >= 0.85
ORDER BY (discount_percent * 0.3 + positive_review_ratio * 0.7) DESC
LIMIT 5;
```

---

### 2. 섹션: 압도적 긍정적 할인 게임

**제목**: "압도적 긍정적 평가 + 할인 중"

**콘텐츠**:

- 가로 스크롤 카드 (20개)
- 리뷰 5,000개 이상 & 압도적 긍정적~대체로 긍정적 & 현재 할인 중

**카드 디자인**:

```
┌─────────────────┐
│  [썸네일 이미지]  │
│                 │
├─────────────────┤
│ 게임 제목        │
│ ₩15,000 -50%    │
│ 👍 95% (50K)    │
└─────────────────┘
```

**데이터 쿼리**:

```sql
SELECT * FROM games
WHERE discount_percent > 0
  AND review_count >= 5000
  AND positive_review_ratio >= 0.80
ORDER BY discount_percent DESC, positive_review_ratio DESC
LIMIT 20;
```

---

### 3. 섹션: 인기 게임

**제목**: "지금 가장 인기 있는 게임"

**콘텐츠**:

- 가로 스크롤 카드 (20개)
- 할인 여부 무관, 압도적 긍정적~대체로 긍정적 리뷰 기준

**데이터 쿼리**:

```sql
SELECT * FROM games
WHERE review_count >= 5000
  AND positive_review_ratio >= 0.80
ORDER BY review_count DESC
LIMIT 20;
```

---

### 4. 추가 섹션

#### 장르별 게임

**섹션 반복**:

- FPS 게임
- RPG 게임
- 인디 게임
- 전략 게임

**쿼리 예시** (FPS):

```sql
SELECT * FROM games
WHERE genres @> '[{"description": "Action"}]'
  AND review_count >= 1000
  AND positive_review_ratio >= 0.75
ORDER BY review_count DESC
LIMIT 20;
```

#### 할인율 높은 순

**제목**: "최대 할인 중"

```sql
SELECT * FROM games
WHERE discount_percent >= 50
  AND review_count >= 1000
ORDER BY discount_percent DESC
LIMIT 20;
```

---

## 필터링/정렬 옵션

### 필터

- **장르**: FPS, RPG, 전략, 인디, 퍼즐, 시뮬레이션, 스포츠 등
- **가격대**: 무료, ~10,000원, ~20,000원, ~50,000원, 50,000원 이상
- **할인 여부**: 할인 중만, 전체
- **리뷰 점수**: 압도적 긍정적 (90%+), 매우 긍정적 (80%+), 긍정적 (70%+)

### 정렬

- 인기순 (리뷰 수)
- 할인율 높은순
- 가격 낮은순
- 가격 높은순
- 최신순 (출시일)

---

## 게임 카드 컴포넌트

### 기본 정보 표시

```jsx
<GameCard>
  <Thumbnail src={game.header_image} />
  <Title>{game.name}</Title>
  <PriceSection>
    {game.discount_percent > 0 ? (
      <>
        <DiscountBadge>-{game.discount_percent}%</DiscountBadge>
        <OriginalPrice>₩{game.original_price.toLocaleString()}</OriginalPrice>
        <FinalPrice>₩{game.price.toLocaleString()}</FinalPrice>
      </>
    ) : (
      <FinalPrice>₩{game.price.toLocaleString()}</FinalPrice>
    )}
  </PriceSection>
  <ReviewSection>
    <Icon>👍</Icon>
    <Percentage>{game.positive_review_ratio * 100}%</Percentage>
    <ReviewCount>({formatNumber(game.review_count)})</ReviewCount>
  </ReviewSection>
</GameCard>
```

### 호버 인터랙션

- 카드 확대 (scale: 1.05)
- 그림자 강화
- 추가 정보 오버레이 (장르, 출시일)

---

## SSR 전략

### 서버 사이드 렌더링

- **초기 데이터**: 히어로 + 상위 3개 섹션 SSR
- **나머지 섹션**: 클라이언트 사이드에서 lazy load

```typescript
// app/page.tsx
export async function generateMetadata() {
  return {
    title: 'Steam Game Recommender - AI 기반 게임 추천',
    description: '당신의 플레이 스타일에 맞는 Steam 게임을 AI가 추천해드립니다.',
    openGraph: {
      title: 'Steam Game Recommender',
      description: 'AI 기반 Steam 게임 추천 서비스',
      images: ['/og-image.png']
    }
  };
}

export default async function LandingPage() {
  const heroGames = await fetchHeroGames();
  const discountGames = await fetchDiscountGames();
  const popularGames = await fetchPopularGames();

  return (
    <>
      <HeroSlider games={heroGames} />
      <Section title="압도적 긍정적 평가 + 할인 중" games={discountGames} />
      <Section title="지금 가장 인기 있는 게임" games={popularGames} />
      <LazyLoadSections />
    </>
  );
}
```

### 성능 최적화

- 이미지 최적화: Next.js `<Image>` 컴포넌트 사용
- 가로 스크롤 가상화: `react-window` 또는 `@tanstack/react-virtual`
- 섹션별 Intersection Observer로 뷰포트 진입 시 데이터 로드

---

## 반응형 디자인

| 화면 크기           | 카드 개수 (1줄)   | 히어로 높이 |
| ------------------- | ----------------- | ----------- |
| 모바일 (<640px)     | 1.5개 (부분 노출) | 50vh        |
| 태블릿 (640-1024px) | 3개               | 55vh        |
| 데스크톱 (>1024px)  | 5-6개             | 60vh        |

---

## 관련 문서

- [게임 상세 페이지](./game-detail.md)
- [데이터 파이프라인](../features/data-pipeline.md)
- [데이터베이스 설계](../database.md)
