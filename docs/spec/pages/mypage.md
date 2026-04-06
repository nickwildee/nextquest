# 마이페이지 (`/mypage`)

## 개요

Steam 로그인 필수. 유저의 Steam 프로필 정보와 소유 게임 라이브러리를 표시.

---

## 인증 가드

### 비로그인 사용자

1. 네비게이션에 "마이페이지" 버튼 미노출
2. 직접 URL 접근 시 (`/mypage`)
   - 미들웨어가 세션 체크
   - 세션 없음 → 401 에러
   - Steam 로그인 페이지로 리다이렉트
   - `redirect=/mypage` 파라미터 포함

### 로그인 사용자

- 네비게이션에 "마이페이지" 버튼 노출
- 클릭 시 바로 접근 가능

---

## 페이지 구조 (위→아래)

### 1. 프로필 섹션

```
┌────────────────────────────────────────────┐
│  [아바타]  [닉네임]                         │
│           Steam ID: 76561198012345678      │
│           마지막 로그인: 2025-01-15         │
│                                            │
│  총 보유 게임: 87개                         │
│  총 플레이타임: 1,250시간                   │
│                                            │
│  [Steam 프로필 보기] [로그아웃]             │
└────────────────────────────────────────────┘
```

**데이터 소스**:

- `users` 테이블: steam_id, display_name, avatar_url, last_login
- `user_games` 테이블 집계: 총 게임 수, 총 플레이타임

---

### 2. 소유 게임 목록

#### 정렬/필터 옵션

```
┌────────────────────────────────────────────┐
│  내 게임 라이브러리                         │
├────────────────────────────────────────────┤
│  [정렬]  ▼ 플레이타임 많은순                │
│  [필터] ▼ 전체 장르                         │
│  [검색] 🔍 [게임명 검색]                    │
└────────────────────────────────────────────┘
```

**정렬 옵션**:

- 플레이타임 많은순 (기본)
- 플레이타임 적은순
- 게임명 가나다순
- 최근 플레이순

**필터 옵션**:

- 전체 장르
- FPS
- RPG
- 전략
- 인디
- etc.

#### 게임 카드

```
┌────────────────────────────────────────────┐
│  [썸네일]  [게임명]                         │
│            플레이타임: 325시간              │
│            장르: FPS, Action               │
│            최근 플레이: 2025-01-10         │
│                                            │
│            [상세보기] [Steam에서 실행]      │
└────────────────────────────────────────────┘
```

**리스트 형태**:

- 페이지네이션 (페이지당 20개)
- 또는 무한 스크롤 (Intersection Observer)

---

### 3. 플레이 통계

```
┌────────────────────────────────────────────┐
│  플레이 통계                                │
├────────────────────────────────────────────┤
│                                            │
│  가장 많이 플레이한 장르                    │
│  📊 FPS: 450시간 (36%)                     │
│  📊 RPG: 320시간 (26%)                     │
│  📊 전략: 180시간 (14%)                    │
│  📊 기타: 300시간 (24%)                    │
│                                            │
│  ────────────────────────────────────────  │
│                                            │
│  Top 5 플레이한 게임                        │
│  1. Counter-Strike 2      450시간         │
│  2. Elden Ring            320시간         │
│  3. Civilization VI       180시간         │
│  4. Hades                 150시간         │
│  5. Stardew Valley        120시간         │
│                                            │
└────────────────────────────────────────────┘
```

**데이터 계산**:

```sql
-- 장르별 플레이타임
SELECT
  genre,
  SUM(ug.playtime_minutes) / 60 as playtime_hours,
  ROUND(SUM(ug.playtime_minutes) * 100.0 / total_playtime.total, 2) as percentage
FROM user_games ug
JOIN games g ON ug.game_id = g.appid
CROSS JOIN (
  SELECT SUM(playtime_minutes) as total
  FROM user_games
  WHERE steam_id = ?
) as total_playtime
WHERE ug.steam_id = ?
GROUP BY genre
ORDER BY playtime_hours DESC;
```

```sql
-- Top 5 게임
SELECT
  g.name,
  ug.playtime_minutes / 60 as playtime_hours
FROM user_games ug
JOIN games g ON ug.game_id = g.appid
WHERE ug.steam_id = ?
ORDER BY ug.playtime_minutes DESC
LIMIT 5;
```

---

## SSR 구현

```typescript
// app/mypage/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth'; // 또는 커스텀 세션 핸들러

export default async function MyPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/api/auth/steam/login?redirect=/mypage');
  }

  const userProfile = await fetchUserProfile(session.steam_id);
  const userGames = await fetchUserGames(session.steam_id);
  const playStats = await fetchPlayStats(session.steam_id);

  return (
    <>
      <ProfileSection user={userProfile} />
      <GameLibrary games={userGames} />
      <PlayStatistics stats={playStats} />
    </>
  );
}
```

---

## 클라이언트 사이드 기능

### 게임 검색

```typescript
'use client';

import { useState } from 'react';

export function GameLibrary({ games }: { games: Game[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <GameList games={filteredGames} />
    </>
  );
}
```

### 정렬/필터

```typescript
const [sortBy, setSortBy] = useState<'playtime' | 'name'>('playtime');
const [genreFilter, setGenreFilter] = useState<string | null>(null);

const sortedGames = useMemo(() => {
  let result = [...games];

  // 장르 필터
  if (genreFilter) {
    result = result.filter(game => game.genres.some(g => g.description === genreFilter));
  }

  // 정렬
  result.sort((a, b) => {
    if (sortBy === 'playtime') {
      return b.playtime_minutes - a.playtime_minutes;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  return result;
}, [games, sortBy, genreFilter]);
```

---

## 성능 최적화

### 가상화 (Virtualization)

게임 목록이 많을 경우 (100개 이상) 가상화 적용:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function GameList({ games }: { games: Game[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 카드 높이
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <GameCard
            key={virtualRow.index}
            game={games[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 데이터 캐싱

```typescript
const { data: userGames, isLoading } = useQuery({
  queryKey: ['userGames', userId],
  queryFn: () => fetchUserGames(userId),
  staleTime: 1000 * 60 * 60, // 1시간
  gcTime: 1000 * 60 * 60 * 2, // 2시간
});
```

---

## 에러 처리

| 에러 상황               | 처리 방법                                           |
| ----------------------- | --------------------------------------------------- |
| Steam 라이브러리 비공개 | "게임 라이브러리가 비공개로 설정되어 있습니다" 안내 |
| Steam API 조회 실패     | "Steam 서버 연결 실패. 잠시 후 다시 시도해주세요"   |
| 세션 만료               | 자동으로 로그인 페이지로 리다이렉트                 |

---

## GA4 이벤트 추적

```typescript
// 마이페이지 진입
gtag('event', 'mypage_view', {
  user_id: userId,
  total_games: userGames.length,
  total_playtime_hours: totalPlaytime,
});

// 게임 상세 페이지 진입 (마이페이지에서)
gtag('event', 'game_detail_view', {
  game_id: gameId,
  source: 'mypage',
});

// Steam에서 실행 클릭
gtag('event', 'steam_launch_click', {
  game_id: gameId,
  playtime_hours: game.playtime_hours,
});
```

---

## 관련 문서

- [인증 시스템](../features/authentication.md)
- [게임 상세 페이지](./game-detail.md)
- [데이터베이스 설계](../database.md)
