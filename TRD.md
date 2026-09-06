# Decision Lab 기술 요구사항 문서

## 1. 문서 개요

### 1.1 목적

이 문서는 [ARCHITECTURE.md](ARCHITECTURE.md)의 시스템 설계를 구현하기 위한 최종 기술 기준을 정의한다. 개발자는 이 문서의 API, 데이터 계약, 계산 규칙, 오류 처리, 테스트 기준을 기준으로 MVP를 구현한다.

### 1.2 구현 기준

- TypeScript의 strict 모드를 사용한다.
- API와 도메인 타입은 단일 타입 정의에서 파생하거나 명시적으로 동기화한다.
- 도메인 계산은 순수 함수로 작성하고 UI 프레임워크와 분리한다.
- 외부 입력은 서버 경계에서 검증한다.
- AI 응답은 구조화 출력과 런타임 스키마 검증을 모두 사용한다.
- 저장 성공 전 사용자에게 확정된 결과를 표시하지 않는다.

## 2. 권장 기술 스택

| 영역 | 기술 | 적용 기준 |
| --- | --- | --- |
| 언어 | TypeScript | 웹, API, 도메인 로직의 타입 일관성 |
| 웹 프레임워크 | Next.js + React | 서버 렌더링, 폼 중심 UX, 단일 배포 단위 |
| 스타일 | CSS Modules 또는 프로젝트 표준 CSS | 컴포넌트 범위 스타일과 접근성 상태 관리 |
| API 검증 | Zod | 요청, 응답, AI JSON 런타임 검증 |
| ORM | Prisma | PostgreSQL 스키마와 마이그레이션 관리 |
| 데이터베이스 | PostgreSQL | 관계 무결성, 트랜잭션, 스냅샷 보존 |
| 차트 | 접근성 지원 React 차트 라이브러리 | 막대그래프 우선, 레이더 차트 보조 |
| 테스트 | Vitest + React Testing Library + Playwright | 단위, 컴포넌트, 핵심 사용자 흐름 |
| 품질 | ESLint + Prettier + TypeScript compiler | 커밋 전 정적 검증 |
| 배포 | Docker 기반 Node.js 실행 환경 | 환경 일관성과 관리형 서비스 이식성 |

### 2.1 의존성 선택 원칙

- 차트, 인증, AI SDK는 인터페이스 뒤에 둔다.
- 도메인 계산을 위해 무거운 런타임 의존성을 추가하지 않는다.
- 새 라이브러리는 번들 크기, 유지보수 상태, 접근성, 서버 런타임 호환성을 검토한다.
- AI SDK가 제공하는 자동 타입만 믿지 않고 애플리케이션 스키마를 별도로 검증한다.

## 3. 프로젝트 구조

```text
src/
  app/                         # 라우트와 서버 화면
    api/v1/                    # 버전 API 라우트
    decisions/                 # 결정 생성/편집/결과 화면
    history/                   # 결정 기록 화면
  components/                  # 재사용 UI 컴포넌트
  domain/
    decision/                  # aggregate, 상태 전이, 도메인 서비스
    scoring/                   # 순수 점수 계산과 안정성 분석
    ai/                        # AI 포트, 프롬프트, 응답 정규화
  infrastructure/
    db/                        # Prisma client와 repository 구현
    ai/                        # 외부 모델 provider 구현
    auth/                      # 인증 provider 구현
    observability/             # 로깅, 메트릭, 추적
  lib/
    validation/                # 공통 Zod 스키마
    errors/                    # 공통 오류 타입과 매핑
  tests/
    unit/
    integration/
    e2e/
prisma/
  schema.prisma
  migrations/
```

## 4. 도메인 상태와 불변식

### 4.1 Decision 상태

```text
draft -> analyzing -> comparing -> decided -> archived
  |          |
  +----------+ (분석 실패 시 draft 또는 comparing 유지)
```

- `draft`: 고민은 저장됐지만 분석 또는 비교 준비가 끝나지 않음
- `analyzing`: AI 분석 요청이 진행 중
- `comparing`: 선택지, 기준, 평가를 수정하고 비교하는 상태
- `decided`: 최종 선택과 확정 스냅샷이 존재함
- `archived`: 사용자 화면의 기본 목록에서 숨김

### 4.2 불변식

- 모든 결정은 소유자 식별자를 가진다.
- `comparing`으로 진입하려면 선택지 2개 이상과 기준 1개 이상이 필요하다.
- 기준의 `importance`는 정수 1~5다.
- 평가의 `score`는 숫자 0~100이다.
- 한 선택지와 한 기준 사이에는 최신 평가 하나만 존재한다.
- `decided` 상태에는 `selected_option_id`, `decided_at`, `DecisionSnapshot`이 모두 존재한다.
- 결정 확정 후에는 확정 스냅샷의 점수와 기준을 변경하지 않는다.
- 사용자가 수정한 엔티티의 `source`는 `user`로 유지한다.

## 5. 데이터베이스 설계

### 5.1 테이블

```text
users
  id, external_subject, created_at

decisions
  id, user_id, title, problem_statement, summary, status,
  selected_option_id, created_at, updated_at, decided_at, archived_at

options
  id, decision_id, name, description, pros_json, cons_json,
  memo, source, created_at, updated_at

criteria
  id, decision_id, name, description, importance, direction,
  source, created_at, updated_at

evaluations
  id, option_id, criterion_id, score, reason, source,
  created_at, updated_at

decision_snapshots
  id, decision_id, criteria_weights_json, option_scores_json,
  total_scores_json, ranking_json, stability_level, score_gap,
  created_at

retrospectives
  id, decision_id, satisfaction_score, important_in_practice,
  memo, created_at, updated_at
```

### 5.2 제약조건과 인덱스

- `decisions.user_id` 외래 키와 `users.id`의 삭제 정책을 명시한다.
- `options.decision_id`, `criteria.decision_id`, `decision_snapshots.decision_id`에 인덱스를 둔다.
- `evaluations`에 `(option_id, criterion_id)` unique 제약을 둔다.
- 결정 목록 조회를 위해 `(user_id, updated_at desc)` 복합 인덱스를 둔다.
- 모든 날짜는 UTC로 저장하고 API에서 ISO 8601 문자열로 반환한다.
- JSON 컬럼은 사용자 표시용 스냅샷과 계산 재현에 필요한 값만 저장한다.

### 5.3 트랜잭션

다음 작업은 하나의 데이터베이스 트랜잭션으로 처리한다.

- 결정 확정: 최신 계산, 스냅샷 생성, 선택지 연결, 상태 변경
- 선택지/기준 삭제와 연관 평가 삭제
- 사용자 수정 승인: 엔티티 수정과 분석 상태 갱신
- 회고 저장과 `updated_at` 갱신

## 6. 점수 계산 기술 사양

### 6.1 입력

```ts
type ScoreInput = {
  criteria: Array<{
    id: string;
    importance: number; // 1..5
  }>;
  options: Array<{
    id: string;
    evaluations: Array<{
      criterionId: string;
      score: number; // 0..100
    }>;
  }>;
};
```

### 6.2 출력

```ts
type ScoreResult = {
  options: Array<{
    optionId: string;
    totalScore: number;
    rank: number | null;
    contributions: Array<{
      criterionId: string;
      weightedScore: number;
    }>;
  }>;
  scoreGap: number | null;
  stabilityLevel: 'high' | 'medium' | 'low' | 'unavailable';
  tie: boolean;
};
```

### 6.3 계산 규칙

각 선택지 $j$의 종합 점수는 다음 가중 평균을 사용한다.

$$
S_j = \frac{\sum_i w_i s_{ij}}{\sum_i w_i}
$$

- `w_i`: 기준의 중요도 1~5
- `s_ij`: 선택지의 기준별 점수 0~100
- `sum(w_i) = 0`은 입력 검증으로 차단한다.
- 내부 계산은 double precision으로 수행한다.
- 표시 점수는 소수 둘째 자리로 반올림한다.
- 순위와 점수 차이는 반올림 전 점수로 계산한다.
- 동일 점수의 허용 오차는 `1e-9`로 둔다.
- 평가가 누락된 선택지는 확정 계산을 거부한다. 누락 값을 0점으로 간주하지 않는다.

### 6.4 안정성

선택지가 두 개 이상이면 내림차순 정렬 후 1위와 2위의 차이를 `scoreGap`으로 저장한다.

```text
scoreGap >= 10       -> high
5 <= scoreGap < 10   -> medium
scoreGap < 5         -> low
```

선택지가 하나이거나 필수 점수가 없으면 `unavailable`을 반환한다. 안정성은 추천의 확률이나 성공 보장이 아니다.

### 6.5 What-if

- 입력은 저장된 결정의 기준과 평가를 복사한 뒤 일부 `importance`만 대체한다.
- 서버는 기본 스냅샷을 수정하지 않는다.
- 응답에는 `baseResult`, `scenarioResult`, 변경된 기준, 순위 변화 여부를 포함한다.
- 순위가 역전되면 두 결과의 기준별 기여도 차이를 내림차순으로 반환한다.

## 7. API 계약

모든 API 경로는 `/api/v1`로 시작한다. 오류는 다음 형태를 사용한다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청을 확인해 주세요.",
    "details": []
  },
  "requestId": "req_123"
}
```

### 7.1 결정 API

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/decisions` | 새 결정 초안 생성 |
| GET | `/decisions` | 사용자의 결정 목록 조회 |
| GET | `/decisions/:id` | 결정과 현재 결과 조회 |
| PATCH | `/decisions/:id` | 제목, 고민, 요약 수정 |
| POST | `/decisions/:id/analyze` | AI 고민 분석 실행 |
| PATCH | `/decisions/:id/analysis` | AI 제안 승인/수정 |
| POST | `/decisions/:id/options` | 선택지 추가 |
| PATCH | `/decisions/:id/options/:optionId` | 선택지 수정 |
| DELETE | `/decisions/:id/options/:optionId` | 선택지 삭제 |
| POST | `/decisions/:id/criteria` | 판단 기준 추가 |
| PATCH | `/decisions/:id/criteria/:criterionId` | 판단 기준/중요도 수정 |
| DELETE | `/decisions/:id/criteria/:criterionId` | 판단 기준 삭제 |
| PATCH | `/decisions/:id/evaluations` | 평가 점수/근거 일괄 수정 |
| POST | `/decisions/:id/what-if` | 임시 가중치 결과 계산 |
| POST | `/decisions/:id/confirm` | 최종 결정 확정 |
| POST | `/decisions/:id/archive` | 결정 보관 |

### 7.2 주요 요청 예시

`POST /api/v1/decisions`

```json
{
  "title": "노트북 선택",
  "problemStatement": "게임과 사무 작업에 적합한 노트북을 고르고 싶다.",
  "initialOptions": ["A 모델", "B 모델"]
}
```

`POST /api/v1/decisions/:id/what-if`

```json
{
  "importanceOverrides": [
    { "criterionId": "criterion_portability", "importance": 5 }
  ]
}
```

`POST /api/v1/decisions/:id/confirm`

```json
{
  "selectedOptionId": "option_a",
  "confirmationNote": "휴대성을 조금 포기하고 성능을 우선했다."
}
```

### 7.3 HTTP 상태 코드

- `200`: 조회 또는 수정 성공
- `201`: 리소스 생성 성공
- `202`: 비동기 AI 분석 접수
- `400`: 형식 또는 값이 잘못됨
- `401`: 인증 필요
- `403`: 소유권 없음
- `404`: 리소스 없음
- `409`: 현재 상태에서 수행할 수 없음 또는 중복 요청
- `422`: 도메인 규칙 위반
- `429`: 요청 또는 AI 사용량 제한
- `500`: 처리되지 않은 서버 오류
- `502/503`: 외부 AI 제공자 오류

## 8. AI 통합 사양

### 8.1 포트 인터페이스

```ts
interface AiProvider {
  analyzeProblem(input: ProblemAnalysisInput): Promise<ProblemAnalysisOutput>;
  suggestOptions(input: OptionSuggestionInput): Promise<OptionSuggestionOutput>;
  suggestCriteria(input: CriteriaSuggestionInput): Promise<CriteriaSuggestionOutput>;
  evaluateOptions(input: EvaluationInput): Promise<EvaluationOutput>;
  explainDecision(input: DecisionExplanationInput): Promise<DecisionExplanationOutput>;
}
```

### 8.2 구조화 응답 규칙

- 모델 호출은 JSON schema 또는 동등한 structured output을 요구한다.
- 반환 후 Zod 스키마로 필수 필드, enum, 배열 길이, 문자열 길이를 검증한다.
- 실패한 응답은 자동으로 최대 1회만 재시도한다.
- 재시도에도 실패하면 사용자가 수동으로 계속할 수 있는 오류를 반환한다.
- 모델 응답의 `totalScore`, `rank`, `stabilityLevel`은 무시하고 서버 계산 결과를 사용한다.
- AI가 만든 객체는 `source: 'ai'`로 저장하고 사용자 수정 시 `source: 'user'`로 바꾼다.

### 8.3 프롬프트 입력 제한

- 사용자 원문과 메모의 최대 길이를 서버에서 제한한다.
- 시스템 지침, 사용자 데이터, 계산용 JSON을 프롬프트에서 명확히 구분한다.
- 외부 검색을 사용하지 않는 MVP에서는 최신 사실을 추정하지 않도록 지시한다.
- 의료/법률/투자/안전 신호가 감지되면 답변을 참고용으로 제한한다.

## 9. 인증, 권한, 개인정보

### 9.1 인증

인증 provider는 `AuthContext` 인터페이스 뒤에 둔다. MVP가 익명 사용을 지원하더라도 서버는 `subjectId`를 발급해 결정 소유권을 확인할 수 있어야 한다.

```ts
type AuthContext = {
  subjectId: string;
  sessionId: string;
  isAuthenticated: boolean;
};
```

### 9.2 권한

- 모든 `GET`, `PATCH`, `DELETE`, `POST` 결정 API는 `decision.user_id = auth.subjectId`를 확인한다.
- ID만 아는 사용자가 다른 사용자의 결정 존재 여부를 추측할 수 없도록 권한 실패는 `404`로 통합할 수 있다.
- 운영자용 데이터 접근은 별도 역할과 감사 로그가 필요하다.

### 9.3 보존과 삭제

- 사용자가 삭제를 요청한 결정은 기본 조회에서 즉시 제외한다.
- 영구 삭제 작업은 관련 선택지, 기준, 평가, 스냅샷, 회고를 트랜잭션으로 처리한다.
- 로그에는 원문 대신 `decisionId`, `requestId`, 길이, 상태 코드만 기록한다.

## 10. 오류 처리와 관측성

### 10.1 오류 분류

```text
VALIDATION_ERROR       입력 형식/범위 오류
DOMAIN_RULE_VIOLATION  상태 또는 도메인 규칙 위반
NOT_FOUND              리소스 없음
FORBIDDEN              접근 권한 없음
AI_PROVIDER_ERROR      외부 AI 호출 실패
AI_SCHEMA_ERROR        AI 응답 검증 실패
PERSISTENCE_ERROR      DB 저장/조회 실패
RATE_LIMITED           사용량 제한
```

### 10.2 로그 필드

- `timestamp`
- `level`
- `requestId`
- `route`
- `subjectHash`
- `decisionId`
- `durationMs`
- `statusCode`
- `errorCode`
- `aiProvider`
- `aiLatencyMs`
- `tokenUsage` (제공되는 경우)

고민 원문, 프롬프트 전체, 모델 응답 전체, 인증 토큰은 기본 로그에 기록하지 않는다.

### 10.3 핵심 메트릭

- API 요청 성공/실패율과 p95 지연 시간
- 점수 계산 지연 시간
- AI 성공률, 재시도율, 오류 유형별 비율
- 결정 생성 대비 확정 전환율
- What-if 요청 수
- 사용자 입력 수정 비율

## 11. 테스트 전략

### 11.1 단위 테스트

- 가중 평균 계산
- 누락 평가 거부
- 점수 범위 검증
- 동점 처리
- 안정성 구간 경계값: 5, 10
- What-if 시나리오와 순위 역전 탐지
- 상태 전이와 불변식
- AI 응답 정규화 및 잘못된 JSON 거부

### 11.2 통합 테스트

- 결정 생성부터 분석 결과 저장까지의 트랜잭션
- 선택지/기준/평가 CRUD와 소유권 검사
- 결정 확정 시 스냅샷과 상태 변경의 원자성
- AI 실패 후 수동 진행
- 결정 삭제 시 연관 데이터 정리

### 11.3 E2E 테스트

1. 고민 입력
2. AI 분석 결과 승인 또는 수정
3. 선택지와 기준 편집
4. 중요도 조절과 결과 확인
5. What-if 결과 취소 또는 적용
6. 최종 결정 확정
7. 기록 상세와 회고 저장

모바일 뷰포트와 키보드 전용 시나리오를 최소 한 세트 포함한다.

## 12. 성능 및 운영 기준

- 저장된 데이터로 수행하는 점수 계산 API p95는 300ms 이하를 목표로 한다.
- 일반 CRUD API p95는 500ms 이하를 목표로 한다.
- AI 분석은 30초 타임아웃을 사용하고, UI에 진행 상태를 표시한다.
- AI 호출은 사용자/세션별 rate limit을 적용한다.
- DB 연결 풀과 요청 타임아웃을 설정한다.
- 스키마 변경은 마이그레이션으로만 반영하고, 배포 전 staging에서 검증한다.
- 운영 배포는 빌드, 타입 검사, 린트, 단위/통합 테스트 통과를 조건으로 한다.
- 결정 확정 API는 idempotency key를 지원해 재시도에 따른 중복 확정을 막는다.

## 13. 환경 변수 계약

```text
DATABASE_URL
AI_PROVIDER
AI_API_KEY
AI_MODEL
AI_REQUEST_TIMEOUT_MS
AUTH_SECRET
APP_BASE_URL
LOG_LEVEL
RATE_LIMIT_STORE_URL
```

비밀값은 저장소에 커밋하지 않는다. `.env.example`에는 이름과 안전한 예시만 두고 실제 값은 환경의 Secret Manager에서 주입한다.

## 14. 구현 순서

### Phase 1: 도메인 기반

1. TypeScript 프로젝트와 품질 도구 설정
2. 도메인 타입과 상태 전이 구현
3. Scoring Engine과 경계값 테스트 구현
4. Prisma 스키마와 마이그레이션 구현

### Phase 2: 수동 비교 흐름

1. 결정/선택지/기준 CRUD API
2. 평가 입력과 종합 결과 화면
3. 결정 확정과 스냅샷
4. 핵심 E2E 흐름

### Phase 3: AI 흐름

1. `AiProvider`와 테스트 fake 구현
2. 고민 분석 구조화 응답
3. 선택지/기준 제안과 사용자 승인
4. 평가 근거와 결정 분석
5. AI 오류/재시도/수동 진행 UX

### Phase 4: 차별화 및 운영

1. What-if 실험
2. 회고 기록
3. 인증과 결정 목록
4. 관측성, rate limit, 백업, 배포 자동화

## 15. 완료 기준

- PRD의 P0 기능이 구현되고 출시 전 검증 시나리오를 통과한다.
- 동일한 입력에 대한 점수 결과가 모든 환경에서 동일하다.
- AI가 반환한 점수와 서버 계산 점수가 혼용되지 않는다.
- 사용자가 AI 호출 없이도 수동으로 비교와 결정 확정을 완료할 수 있다.
- 다른 사용자의 결정 데이터가 API나 화면에서 조회되지 않는다.
- 모바일, 키보드, 오류, 빈 상태가 검증된다.
- 문서의 API 계약과 실제 구현의 요청/응답 스키마가 일치한다.