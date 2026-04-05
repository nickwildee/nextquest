# 모니터링 & 분석

## 개요

서비스 품질 향상과 사용자 행동 분석을 위한 모니터링 도구 구성. Microsoft Clarity, Google Analytics 4, Sentry 통합.

---

## 도구 개요

| 카테고리 | 도구 | 역할 | 비용 |
|----------|------|------|------|
| 유저 행동 분석 | Microsoft Clarity | 히트맵, 세션 레코딩, 클릭 패턴 | 무료 |
| 이벤트/퍼널 추적 | Google Analytics 4 (GA4) | 커스텀 이벤트, 전환율, 재방문율 | 무료 (기본) |
| 에러 모니터링 | Sentry | 런타임 에러, 크래시 로그, 환경별 에러 추적 | 무료 (5K 이벤트/월) |

---

## 1. Microsoft Clarity

### 목적

유저의 실제 행동 패턴을 시각적으로 파악하여 UX 개선.

### 주요 기능

#### 히트맵 (Heatmap)

- **클릭 히트맵**: 사용자가 가장 많이 클릭하는 영역 시각화
- **스크롤 히트맵**: 페이지 스크롤 깊이 분석

**활용**:
- 랜딩 페이지 섹션별 클릭 집중 영역 파악
- "Steam에서 구매하기" 버튼 클릭률 분석
- 불필요한 콘텐츠 식별 (스크롤 안 되는 영역)

#### 세션 레코딩 (Session Recording)

- 실제 유저의 화면 조작을 영상으로 기록
- 마우스 움직임, 클릭, 스크롤 재생

**활용**:
- AI 추천 선택지에서 어디서 이탈하는지 확인
- 게임 상세 페이지에서 어떤 섹션을 주로 보는지 파악

#### 데드 클릭 / 분노 클릭 감지

- **데드 클릭**: 클릭 가능해 보이지만 반응 없는 요소
- **분노 클릭**: 같은 위치를 짧은 시간에 여러 번 클릭

**활용**:
- UI 혼란 지점 발견
- 버튼 디자인 개선 필요 영역 파악

### 구현

```html
<!-- app/layout.tsx 또는 _document.tsx -->
<head>
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "YOUR_CLARITY_PROJECT_ID");
  </script>
</head>
```

---

## 2. Google Analytics 4 (GA4)

### 목적

사용자 행동 데이터를 정량적으로 추적하여 비즈니스 지표 분석.

### 추적 지표

| 카테고리 | 지표 | 설명 |
|----------|------|------|
| 트래픽 | 페이지뷰 / 세션 수 | 전체 방문 규모 파악 |
| 트래픽 | 유입 경로 (Referrer) | 사용자가 어디서 유입되었는지 |
| 전환 | Steam 로그인 전환율 | 비로그인 → 로그인 전환 비율 |
| AI 추천 | 추천 완료율 | 선택지 시작 → 결과까지 완료한 비율 |
| AI 추천 | 추천 결과 클릭률 | 추천 결과에서 게임 상세 페이지 진입 비율 |
| 랜딩 | 섹션별 클릭률 | 어느 섹션(할인/인기/장르별)에서 클릭이 많은지 |
| 이탈 | Steam 스토어 외부 링크 클릭 수 | 실제 구매 의향 간접 측정 |
| 리텐션 | 재방문율 | 7일 내 재방문 비율 |

### 커스텀 이벤트

```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, params?: object) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};
```

#### 1. AI 추천 플로우

```typescript
// 추천 시작
trackEvent('recommend_start', {
  genre: selectedGenre,
  price_range: selectedPrice,
  pc_spec: selectedSpec,
  playtime: selectedPlaytime
});

// 추천 완료
trackEvent('recommend_complete', {
  result_count: recommendations.length,
  duration_ms: elapsed
});

// 추천 결과 클릭
trackEvent('recommend_click', {
  game_id: gameId,
  rank: index + 1,
  score: game.score
});
```

#### 2. 게임 상세 페이지

```typescript
trackEvent('game_detail_view', {
  game_id: gameId,
  game_name: game.name,
  source: referrer // 'landing', 'recommend', 'mypage', 'direct'
});
```

#### 3. Steam 스토어 링크

```typescript
trackEvent('steam_store_click', {
  game_id: gameId,
  game_name: game.name,
  price: game.price,
  discount_percent: game.discount_percent
});
```

#### 4. 로그인

```typescript
// 로그인 버튼 클릭
trackEvent('login_click', {
  source: source // 'navigation', 'recommend_page'
});

// 로그인 성공
trackEvent('login_success', {
  steam_id: steamId,
  is_new_user: isNewUser
});
```

### 구현

```html
<!-- app/layout.tsx -->
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_GA4_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-YOUR_GA4_ID', {
      page_path: window.location.pathname,
    });
  </script>
</head>
```

---

## 3. Sentry

### 목적

런타임 에러 및 크래시 자동 추적, 디버깅 효율화.

### 추적 내용

- **프론트엔드 에러**: React 렌더링 에러, API 호출 실패
- **백엔드 에러**: 서버 크래시, 데이터베이스 오류, 외부 API 장애
- **성능 이슈**: 느린 API 응답, 메모리 누수

### 주요 기능

#### 에러 자동 캡처

```typescript
// 예외 발생 시 자동으로 Sentry에 전송
throw new Error('Something went wrong');
```

#### 컨텍스트 정보

- 에러 발생 시점의 브라우저, OS, 유저 정보
- 에러 발생 직전 유저 액션 경로 (Breadcrumbs)
- API 요청 파라미터, 응답 데이터

#### Release 태깅

배포별 에러율 비교:

```bash
# 배포 시
sentry-cli releases new v1.2.3
sentry-cli releases set-commits v1.2.3 --auto
sentry-cli releases finalize v1.2.3
```

### 구현

#### 프론트엔드 (Next.js)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% 트랜잭션 추적
  beforeSend(event, hint) {
    // 민감한 정보 필터링
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  }
});
```

#### 백엔드 (Node.js)

```typescript
// backend/server.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres()
  ],
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

#### 에러 경계 (React)

```typescript
// components/ErrorBoundary.tsx
import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <div>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</div>;
    }
    return this.props.children;
  }
}
```

### 외부 API 장애 추적

```typescript
// AI API 호출 실패
try {
  const result = await callAIAPI(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      api: 'ai_recommendation',
      model: 'gpt-4o-mini'
    },
    contexts: {
      request: {
        user_preferences: preferences,
        candidate_count: candidates.length
      }
    }
  });
  throw error;
}
```

---

## 4. Core Web Vitals 모니터링

### 주요 지표

| 지표 | 의미 | 목표 |
|------|------|------|
| LCP (Largest Contentful Paint) | 최대 콘텐츠 렌더링 시간 | < 2.5초 |
| FID (First Input Delay) | 첫 입력 지연 시간 | < 100ms |
| CLS (Cumulative Layout Shift) | 누적 레이아웃 이동 | < 0.1 |

### 측정

#### Web Vitals 라이브러리

```typescript
// lib/webVitals.ts
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // GA4로 전송
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

---

## 5. 알림 설정

### Sentry 알림

- **Error Rate > 10%**: 즉시 Slack/Email 알림
- **Critical Error**: 데이터베이스 연결 실패, AI API 전체 장애 등

### GA4 알림 (선택적)

- **일일 활성 유저 급감** (> 50% 감소)
- **Steam 로그인 전환율 급락** (< 5%)

---

## 대시보드 구성

### Clarity 대시보드

- 랜딩 페이지 히트맵
- AI 추천 플로우 세션 레코딩
- 데드 클릭 / 분노 클릭 리스트

### GA4 대시보드

- 일일/주간/월간 트래픽
- 추천 완료율, 클릭률
- 상위 10개 인기 게임
- 유입 경로 분석
- 재방문율

### Sentry 대시보드

- 에러 발생률 (시간대별)
- 가장 빈번한 에러 Top 10
- Release별 에러 비교
- 외부 API 실패율

---

## 개인정보 보호

### 데이터 익명화

```typescript
// Sentry
beforeSend(event) {
  if (event.user) {
    delete event.user.email;
    event.user.id = hashUserId(event.user.id); // Steam ID 해싱
  }
  return event;
}
```

### GA4 IP 익명화

```javascript
gtag('config', 'G-YOUR_GA4_ID', {
  anonymize_ip: true
});
```

### GDPR 준수

- 쿠키 배너 표시 (유럽 사용자 대상)
- 사용자 데이터 삭제 요청 처리 기능

---

## 모니터링 체크리스트

- [ ] Microsoft Clarity 연동 (히트맵, 세션 레코딩)
- [ ] GA4 연동 (커스텀 이벤트 설정)
- [ ] Sentry 연동 (프론트엔드 + 백엔드)
- [ ] Web Vitals 측정 및 GA4 전송
- [ ] Sentry Error Rate 알림 설정
- [ ] 개인정보 익명화 설정
- [ ] 대시보드 정기 리뷰 (주 1회)

---

## 관련 문서

- [랜딩 페이지](./pages/landing.md)
- [AI 추천 페이지](./pages/recommend.md)
- [보안 정책](./security.md)
