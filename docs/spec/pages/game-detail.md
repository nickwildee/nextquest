# 게임 상세 페이지 (`/game/[id]`)

## 개요

특정 게임의 상세 정보를 표시하는 페이지. 비로그인/로그인 모두 접근 가능. Steam 스토어 정보 + YouTube 영상 + 리뷰 요약 제공.

---

## URL 구조

```
/game/[id]
```

**예시**:
- `/game/570` - Dota 2
- `/game/730` - Counter-Strike 2

---

## 페이지 구조 (위→아래)

### 1. 헤더 섹션

```
┌────────────────────────────────────────────┐
│  [게임 썸네일 배경 (블러 처리)]             │
│                                            │
│  [게임 로고/제목]                           │
│  [장르 태그] [출시일]                       │
│                                            │
│  ₩15,000  -50%  (원가: ₩30,000)           │
│                                            │
│  👍 95% 긍정적 (50,000개 리뷰)             │
│                                            │
│  [Steam에서 구매하기]                       │
└────────────────────────────────────────────┘
```

**데이터 소스**: `games` 테이블

---

### 2. 스크린샷 갤러리

**UI**:
- 가로 스크롤 또는 그리드 레이아웃
- 클릭 시 라이트박스 (전체 화면)
- 5-10개 스크린샷

```jsx
<Gallery>
  {game.screenshots.map(screenshot => (
    <Image
      key={screenshot.id}
      src={screenshot.path_full}
      alt={game.name}
      onClick={() => openLightbox(screenshot)}
    />
  ))}
</Gallery>
```

---

### 3. 게임 설명

**구조**:

```
┌────────────────────────────────────────────┐
│  게임 정보                                  │
├────────────────────────────────────────────┤
│                                            │
│  [짧은 설명]                                │
│  (2-3줄 요약)                               │
│                                            │
│  [상세 설명]                                │
│  (HTML 형식, Steam API에서 제공)            │
│                                            │
└────────────────────────────────────────────┘
```

**HTML 정리**:
- Steam API는 HTML 태그 포함한 설명 제공
- `dangerouslySetInnerHTML` 사용 시 XSS 방지 (DOMPurify)

```typescript
import DOMPurify from 'isomorphic-dompurify';

function GameDescription({ description }: { description: string }) {
  const cleanHTML = DOMPurify.sanitize(description);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

---

### 4. YouTube 영상 섹션

**제목**: "이 게임의 플레이 영상"

**YouTube Data API v3 사용**:

#### API 호출

```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=[게임명] gameplay
  &type=video
  &order=viewCount
  &maxResults=5
  &key=[API_KEY]
```

**대체 검색어**:
- 1순위: `[게임명] gameplay`
- 2순위 (결과 없을 시): `[게임명] review`
- 3순위: `[게임명] trailer`

#### 영상 임베드

```jsx
<YouTubeSection>
  <Title>이 게임의 플레이 영상</Title>
  <VideoGrid>
    {videos.map(video => (
      <VideoCard key={video.id}>
        <iframe
          src={`https://www.youtube.com/embed/${video.id.videoId}`}
          title={video.snippet.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <VideoTitle>{video.snippet.title}</VideoTitle>
        <ChannelName>{video.snippet.channelTitle}</ChannelName>
      </VideoCard>
    ))}
  </VideoGrid>
</YouTubeSection>
```

#### 쇼츠 (Shorts) 포함

- YouTube Shorts도 함께 표시 (짧은 영상)
- 필터: `videoDuration=short` (4분 이하)

---

### 5. 시스템 요구사양

```
┌────────────────────────────────────────────┐
│  시스템 요구사양                            │
├────────────────────────────────────────────┤
│                                            │
│  [최소 사양]           [권장 사양]          │
│  OS: Windows 10        OS: Windows 11      │
│  CPU: i5-8400          CPU: i7-10700K      │
│  GPU: GTX 1060         GPU: RTX 3060       │
│  RAM: 8GB              RAM: 16GB           │
│  Storage: 50GB         Storage: 50GB SSD   │
│                                            │
└────────────────────────────────────────────┘
```

**데이터 소스**: `games.pc_requirements` (JSON)

---

### 6. 추가 정보

**표 형식**:

| 항목 | 내용 |
|------|------|
| 개발사 | [개발사명] |
| 배급사 | [배급사명] |
| 출시일 | 2023년 1월 15일 |
| 장르 | Action, FPS, Shooter |
| 지원 언어 | 한국어, English, 日本語 |

---

### 7. CTA (Call to Action)

**고정 하단 바** (스크롤 시 따라다님):

```
┌────────────────────────────────────────────┐
│  [게임명]                                   │
│  ₩15,000 (-50%)                            │
│                                            │
│  [Steam에서 구매하기] ➜                     │
└────────────────────────────────────────────┘
```

**Steam 스토어 링크**:
```
https://store.steampowered.com/app/[APP_ID]
```

---

## SSR 구현

### 서버 사이드 데이터 패칭

```typescript
// app/game/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const game = await fetchGameById(params.id);

  return {
    title: `${game.name} - Steam Game Recommender`,
    description: game.short_description,
    openGraph: {
      title: game.name,
      description: game.short_description,
      images: [game.header_image]
    }
  };
}

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const game = await fetchGameById(params.id);
  const youtubeVideos = await fetchYouTubeVideos(game.name);

  return (
    <>
      <GameHeader game={game} />
      <ScreenshotGallery screenshots={game.screenshots} />
      <GameDescription description={game.detailed_description} />
      <YouTubeSection videos={youtubeVideos} />
      <SystemRequirements requirements={game.pc_requirements} />
      <FixedCTA game={game} />
    </>
  );
}
```

### 에러 처리

```typescript
// app/game/[id]/not-found.tsx
export default function GameNotFound() {
  return (
    <div>
      <h1>게임을 찾을 수 없습니다</h1>
      <p>입력하신 게임 ID가 존재하지 않거나 삭제되었습니다.</p>
      <Link href="/">홈으로 돌아가기</Link>
    </div>
  );
}
```

---

## 성능 최적화

### 이미지 최적화

```jsx
import Image from 'next/image';

<Image
  src={game.header_image}
  alt={game.name}
  width={600}
  height={300}
  priority // Above the fold
  placeholder="blur"
/>
```

### YouTube API 캐싱

- TanStack Query로 1시간 캐싱
- 동일 게임 재방문 시 API 호출 생략

```typescript
const { data: videos } = useQuery({
  queryKey: ['youtube', gameName],
  queryFn: () => fetchYouTubeVideos(gameName),
  staleTime: 1000 * 60 * 60, // 1시간
});
```

---

## GA4 이벤트 추적

```typescript
// 게임 상세 페이지 진입
gtag('event', 'game_detail_view', {
  game_id: gameId,
  game_name: game.name,
  source: referrer // 'landing', 'recommend', 'direct'
});

// Steam 스토어 링크 클릭
gtag('event', 'steam_store_click', {
  game_id: gameId,
  game_name: game.name,
  price: game.price,
  discount_percent: game.discount_percent
});

// YouTube 영상 재생
gtag('event', 'video_play', {
  game_id: gameId,
  video_id: videoId
});
```

---

## 관련 문서

- [랜딩 페이지](./landing.md)
- [AI 추천 페이지](./recommend.md)
- [데이터 파이프라인](../features/data-pipeline.md)
- [모니터링 전략](../monitoring.md)
