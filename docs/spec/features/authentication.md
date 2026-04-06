# 인증 시스템

## 개요

Steam OpenID를 활용한 소셜 로그인 구현. 별도 회원가입 없이 Steam 계정으로 즉시 서비스 이용 가능.

---

## Steam OpenID 인증 플로우

```
1. 유저가 "Steam 로그인" 버튼 클릭
   ↓
2. Backend: Steam OpenID 인증 URL 생성 및 리다이렉트
   - return_to: https://yourdomain.com/api/auth/steam/callback
   ↓
3. 유저가 Steam 로그인 페이지에서 인증 (Steam 서버)
   ↓
4. Steam이 콜백 URL로 리다이렉트 (openid.* 파라미터 포함)
   ↓
5. Backend: Steam 서버에 openid.signed 필드 검증 요청
   ↓
6. 검증 성공 → Steam ID 추출
   ↓
7. Steam Web API로 유저 정보 조회 (프로필, 라이브러리)
   ↓
8. DB에 유저 정보 저장/업데이트 (users, user_games)
   ↓
9. 세션 생성 (7일 유지)
   ↓
10. 프론트엔드로 리다이렉트 (원래 페이지 또는 /recommend)
```

---

## API 엔드포인트

### 1. 로그인 시작

```
POST /api/auth/steam/login
```

**처리**:

- Steam OpenID Provider URL 생성
- `return_to` 파라미터에 콜백 URL 설정
- Steam 로그인 페이지로 리다이렉트

### 2. 콜백 처리

```
GET /api/auth/steam/callback?openid.*
```

**처리**:

1. `openid.signed` 필드를 Steam 서버에 직접 검증 요청
2. 검증 성공 시 `openid.claimed_id`에서 Steam ID 추출
3. Steam Web API 호출:
   - `ISteamUser/GetPlayerSummaries`: 유저 프로필
   - `IPlayerService/GetOwnedGames`: 소유 게임 목록 + 플레이타임
4. DB 저장/업데이트
5. 세션 생성 및 쿠키 설정
6. 원래 페이지 또는 기본 페이지로 리다이렉트

### 3. 로그아웃

```
POST /api/auth/logout
```

**처리**:

- 세션 삭제
- 쿠키 제거
- 200 OK 반환

### 4. 현재 유저 정보 조회

```
GET /api/auth/me
```

**응답**:

```json
{
  "steam_id": "76561198012345678",
  "display_name": "PlayerName",
  "avatar_url": "https://...",
  "last_login": "2025-01-15T10:30:00Z"
}
```

---

## 세션 관리

### 세션 설정

- **유지 기간**: 7일
- **저장 위치**:
  - Phase 1: 서버 메모리 또는 파일 기반 세션 스토어
  - Phase 2: Redis (Spring 마이그레이션 시)
- **쿠키 설정**:
  ```javascript
  {
    httpOnly: true,      // XSS 방어
    secure: true,        // HTTPS only
    sameSite: 'lax',     // CSRF 방어
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
  }
  ```

### 세션 만료 처리

- 7일 후 자동 만료
- 만료된 세션으로 요청 시 401 Unauthorized 반환
- 프론트엔드에서 401 감지 → 로그인 페이지로 리다이렉트

---

## 보안 조치

### 1. Steam OpenID 콜백 검증

**위협**: 콜백 URL 위조 공격

**방어**:

- `openid.signed` 필드를 Steam 서버에 직접 재검증 요청
- 응답이 `is_valid:true`인 경우만 인증 성공 처리
- 콜백 도메인 화이트리스트 설정

```javascript
const ALLOWED_CALLBACK_DOMAINS = ['https://yourdomain.com', 'https://www.yourdomain.com'];

// 콜백 URL 검증
if (!ALLOWED_CALLBACK_DOMAINS.includes(new URL(callbackUrl).origin)) {
  throw new Error('Invalid callback domain');
}
```

### 2. CORS 설정

```javascript
// backend
app.use(
  cors({
    origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST'],
  })
);
```

**주의**: 와일드카드(`*`) 사용 금지

### 3. HTTPS 강제 적용

- 전체 서비스 HTTPS 필수
- HTTP 요청은 HTTPS로 자동 리다이렉트
- 배포 환경에서 SSL 인증서 적용

---

## 비로그인 사용자 처리

### AI 추천 페이지 접근

1. 네비게이션에 "AI 추천" 탭 항상 노출
2. 비로그인 상태에서 클릭 시:
   - 현재 페이지 URL을 쿼리 파라미터로 저장
   - `/api/auth/steam/login?redirect=/recommend`로 리다이렉트
3. 로그인 완료 후 `redirect` 파라미터로 돌아옴

### 마이페이지 접근

- 로그인 후에만 네비게이션에 노출
- 직접 URL 접근 시 401 → 로그인 페이지로 리다이렉트

---

## 유저 데이터 수집

### Steam Web API 호출

#### 1. 유저 프로필

```
GET https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/
  ?key=[API_KEY]
  &steamids=[STEAM_ID]
```

**수집 데이터**:

- Steam ID
- 닉네임
- 아바타 URL
- 프로필 공개 여부

#### 2. 소유 게임 목록

```
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
  ?key=[API_KEY]
  &steamid=[STEAM_ID]
  &include_appinfo=1
  &include_played_free_games=1
```

**수집 데이터**:

- 게임 ID
- 게임명
- 플레이타임 (분 단위)
- 최근 플레이 시간

### DB 저장

#### users 테이블

```sql
INSERT INTO users (steam_id, display_name, avatar_url, last_login)
VALUES (?, ?, ?, NOW())
ON CONFLICT (steam_id)
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  last_login = NOW();
```

#### user_games 테이블

```sql
-- 기존 데이터 삭제 후 재삽입 (전체 동기화)
DELETE FROM user_games WHERE steam_id = ?;

INSERT INTO user_games (steam_id, game_id, playtime_minutes)
VALUES (?, ?, ?), (?, ?, ?), ...;
```

---

## 에러 처리

| 에러 상황           | 처리 방법                                     |
| ------------------- | --------------------------------------------- |
| Steam API 응답 실패 | 재시도 후 실패 시 에러 페이지 표시            |
| 콜백 검증 실패      | 로그인 실패 메시지 + 재시도 안내              |
| 프로필 비공개       | 게임 라이브러리 조회 불가 안내 (AI 추천 제한) |
| 세션 만료           | 401 → 로그인 페이지로 리다이렉트              |

---

## 관련 문서

- [보안 정책](../security.md)
- [데이터베이스 설계](../database.md)
- [AI 추천 페이지](../pages/recommend.md)
