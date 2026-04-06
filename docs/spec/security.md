# 보안 정책

## 개요

서비스 전반에 걸친 보안 조치. Rate Limiting, 인증 검증, 입력값 검증, HTTPS 강제 등.

---

## 1. API Rate Limiting

### AI 추천 API

| 대상        | 제한    | 기준     | 검증 위치            |
| ----------- | ------- | -------- | -------------------- |
| AI 추천 API | 1일 1회 | Steam ID | 백엔드 (서버 사이드) |

**목적**: AI API 비용 절감 및 남용 방지

**구현**:

```javascript
// backend/middleware/rateLimitRecommendation.js
async function checkRecommendationLimit(req, res, next) {
  const steamId = req.session.steam_id;

  const result = await db.query(
    `SELECT
      CASE
        WHEN last_recommended_at IS NULL
          OR last_recommended_at < NOW() - INTERVAL '24 hours'
        THEN true
        ELSE false
      END as can_recommend,
      last_recommended_at + INTERVAL '24 hours' as next_available_at
    FROM users
    WHERE steam_id = $1`,
    [steamId]
  );

  if (!result.rows[0].can_recommend) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'AI 추천은 하루에 1번만 가능합니다.',
      next_available_at: result.rows[0].next_available_at,
    });
  }

  next();
}
```

**프론트 우회 방지**:

- 반드시 백엔드에서 검증
- 세션의 Steam ID를 사용 (클라이언트 입력값 신뢰 금지)

---

### 일반 API

| 대상                               | 제한      | 기준    |
| ---------------------------------- | --------- | ------- |
| 일반 API (게임 목록, 상세 조회 등) | 분당 60회 | IP 주소 |

**목적**: DDoS 방지, 크롤링 방지

**구현**:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60, // 최대 60회
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

app.use('/api', limiter);
```

**예외 처리**:

- `/api/auth` 엔드포인트: 분당 10회로 더 엄격하게 제한

---

## 2. 세션 관리

### 세션 설정

```javascript
import session from 'express-session';
import RedisStore from 'connect-redis'; // Phase 2

app.use(
  session({
    secret: process.env.SESSION_SECRET, // 환경 변수
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // XSS 방어
      secure: true, // HTTPS only
      sameSite: 'lax', // CSRF 방어
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    },
    store: new RedisStore({ client: redisClient }), // Phase 2
  })
);
```

### 세션 만료 처리

- 7일 후 자동 만료
- 만료된 세션으로 요청 시 401 Unauthorized
- 프론트엔드: 401 감지 → 로그인 페이지로 리다이렉트

---

## 3. HTTPS 강제 적용

### 전체 서비스 HTTPS 필수

```javascript
// backend/middleware/forceHttps.js
function forceHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

app.use(forceHttps);
```

### SSL/TLS 인증서

- **배포 환경**: Let's Encrypt 또는 Cloudflare SSL
- **자동 갱신** 설정

---

## 4. 입력값 검증 & SQL Injection 방어

### AI 추천 선택지 검증

프리셋 값이지만 API 레벨에서 화이트리스트 검증 필수:

```javascript
const ALLOWED_VALUES = {
  genre: ['FPS', 'RPG', 'Strategy', 'Puzzle', 'Souls-like', 'Indie'],
  price: [10000, 20000, 30000, 50000],
  pc_spec: ['RTX 20 series', 'RTX 30 series', 'RTX 40 series', 'Mac'],
  playtime: ['<50h', '50-100h', '>100h'],
};

function validatePreferences(preferences) {
  if (!ALLOWED_VALUES.genre.includes(preferences.genre)) {
    throw new Error('Invalid genre');
  }
  if (!ALLOWED_VALUES.price.includes(preferences.price)) {
    throw new Error('Invalid price');
  }
  if (!ALLOWED_VALUES.pc_spec.includes(preferences.pc_spec)) {
    throw new Error('Invalid pc_spec');
  }
  if (!ALLOWED_VALUES.playtime.includes(preferences.playtime)) {
    throw new Error('Invalid playtime');
  }
}
```

### SQL Injection 방어

**Parameterized Query (Prepared Statement) 사용**:

```javascript
// ❌ 취약한 코드
const query = `SELECT * FROM games WHERE name = '${userInput}'`;

// ✅ 안전한 코드
const query = 'SELECT * FROM games WHERE name = $1';
const result = await db.query(query, [userInput]);
```

**ORM 사용 시에도 주의**:

- Raw Query 지양
- ORM의 parameterized query 기능 활용

---

## 5. Steam OpenID 콜백 검증

### 위협: 콜백 URL 위조 공격

**방어 조치**:

#### 1. openid.signed 필드 재검증

```javascript
async function verifySteamCallback(params) {
  // Steam에 직접 검증 요청
  const verifyParams = { ...params, 'openid.mode': 'check_authentication' };

  const response = await axios.post(
    'https://steamcommunity.com/openid/login',
    new URLSearchParams(verifyParams)
  );

  if (!response.data.includes('is_valid:true')) {
    throw new Error('Steam OpenID verification failed');
  }

  return true;
}
```

#### 2. 콜백 도메인 화이트리스트

```javascript
const ALLOWED_CALLBACK_DOMAINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://staging.yourdomain.com', // 스테이징 환경
];

function validateCallbackUrl(url) {
  const origin = new URL(url).origin;
  if (!ALLOWED_CALLBACK_DOMAINS.includes(origin)) {
    throw new Error('Invalid callback domain');
  }
}
```

---

## 6. CORS 설정

```javascript
import cors from 'cors';

app.use(
  cors({
    origin: [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean),
    credentials: true, // 쿠키 전송 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**주의**:

- 와일드카드(`*`) 사용 금지
- `credentials: true`와 와일드카드는 함께 사용 불가

---

## 7. XSS (Cross-Site Scripting) 방어

### HTML 컨텐츠 정리

Steam API에서 받은 HTML 설명 표시 시:

```typescript
import DOMPurify from 'isomorphic-dompurify';

function GameDescription({ description }: { description: string }) {
  const cleanHTML = DOMPurify.sanitize(description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: []
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

### Content Security Policy (CSP)

```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https://cdn.akamai.steamstatic.com https://www.google-analytics.com; " +
      "connect-src 'self' https://api.steampowered.com; " +
      'frame-src https://www.youtube.com;'
  );
  next();
});
```

---

## 8. CSRF (Cross-Site Request Forgery) 방어

### SameSite 쿠키 설정

```javascript
cookie: {
  sameSite: 'lax', // 또는 'strict'
  // ...
}
```

### CSRF 토큰 (선택적)

중요한 변경 작업(추천 요청, 로그아웃 등)에 CSRF 토큰 적용:

```javascript
import csurf from 'csurf';

const csrfProtection = csurf({ cookie: true });

app.post('/api/recommend', csrfProtection, async (req, res) => {
  // ...
});
```

---

## 9. 환경 변수 관리

### .env 파일

```bash
# .env
SESSION_SECRET=your-super-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/steam_recommender
STEAM_API_KEY=your-steam-api-key
AI_API_KEY=your-ai-api-key
YOUTUBE_API_KEY=your-youtube-api-key
NODE_ENV=production
```

### .gitignore

```gitignore
.env
.env.local
.env.production
```

### 프로덕션 환경

- **Vercel**: Environment Variables 설정
- **AWS**: AWS Secrets Manager
- **Docker**: Docker secrets

---

## 10. 에러 핸들링

### 프로덕션 환경에서 에러 정보 숨김

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack); // 서버 로그에만 기록

  // 프로덕션: 일반적인 에러 메시지만 반환
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  } else {
    // 개발 환경: 상세 에러 정보 반환
    res.status(500).json({
      error: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
```

---

## 11. 의존성 보안

### 정기적인 업데이트

```bash
# 취약점 스캔
npm audit

# 자동 수정
npm audit fix

# 패키지 업데이트
npm update
```

### Dependabot 설정

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 10
```

---

## 12. 보안 헤더

```javascript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", 'https://www.googletagmanager.com'],
        imgSrc: ["'self'", 'data:', 'https://cdn.akamai.steamstatic.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## 보안 체크리스트

- [ ] API Rate Limiting 적용 (AI 1일 1회, 일반 분당 60회)
- [ ] 세션 쿠키 secure 설정 (httpOnly, secure, sameSite)
- [ ] HTTPS 강제 적용 (HTTP → HTTPS 리다이렉트)
- [ ] 입력값 화이트리스트 검증
- [ ] Parameterized Query 사용 (SQL Injection 방지)
- [ ] Steam OpenID 콜백 재검증
- [ ] CORS 허용 Origin 제한 (와일드카드 금지)
- [ ] XSS 방어 (DOMPurify, CSP)
- [ ] CSRF 방어 (SameSite 쿠키)
- [ ] 환경 변수 .gitignore 추가
- [ ] 프로덕션 에러 메시지 일반화
- [ ] Helmet 보안 헤더 적용
- [ ] 의존성 취약점 정기 스캔

---

## 관련 문서

- [인증 시스템](./features/authentication.md)
- [AI 추천 기능](./features/ai-recommendation.md)
- [시스템 아키텍처](./architecture.md)
