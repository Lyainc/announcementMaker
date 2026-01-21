# Slack 공지 변환기

인사팀의 정책/안내사항을 Slack 전사 공지 채널에 적합한 형태로 변환하거나, 짧은 요청으로 공지를 생성하는 웹 애플리케이션.

## 주요 기능

- **변환 모드**: 완성된 공지 초안을 Slack 형식으로 변환
- **생성 모드**: 짧은 컨텍스트/목적으로 공지 자동 생성
- **자동 모드 판별**: 입력 텍스트 분석하여 적절한 모드 자동 선택

## 기술 스택

- **Frontend**: Pure HTML/CSS/JavaScript (빌드 도구 없음)
- **API**: Anthropic Claude API (브라우저에서 직접 호출)
- **배포**: 정적 파일 호스팅 (GitHub Pages 등)

## 핵심 파일 설명

| 파일 | 역할 |
|------|------|
| `js/env.js` | Anthropic API 키 저장 (절대 커밋하지 말 것) |
| `js/api.js` | API 호출, 프롬프트 캐싱, 모드별 분기 처리 |
| `js/app.js` | 메인 앱 로직, 모드 판별 (`detectMode()`) |
| `prompts/rulebook.md` | 변환 모드 프롬프트 (Slack 규칙, 톤앤매너, 예시) |
| `prompts/generator.md` | 생성 모드 프롬프트 (짧은 요청으로 공지 생성) |

## 개발 가이드

### 로컬 실행

```bash
# env.js 설정
cp js/env.example.js js/env.js
# env.js에 API 키 입력

# 로컬 서버 실행 (CORS 필요)
python3 -m http.server 8000
# 또는
npx serve .
```

### 수정 시 주의사항

1. **API 키**: `js/env.js`는 gitignored. 절대 하드코딩하지 말 것
2. **Slack 마크다운**: 표준 Markdown과 다름
   - Bold: `*text*` (not `**text**`)
   - Link: `<URL|text>` (not `[text](URL)`)
3. **프롬프트 수정**: `prompts/rulebook.md` 수정 시 토큰 사용량 고려
4. **Prompt Caching**: `api.js`에서 `cache_control: { type: 'ephemeral' }` 사용 중

### 테스트

브라우저에서 직접 테스트:
1. 내용 입력 (짧은 요청 또는 완성된 공지 초안)
2. 실행 버튼 클릭 → 모드 자동 판별 확인 (생성/변환 표시)
3. Slack에 붙여넣기하여 렌더링 확인

**모드 판별 기준:**
- 200자 이상, 4줄 이상, 또는 구조 마커 2개 이상 → 변환 모드
- 그 외 → 생성 모드

## API 사용

- **모델**: Claude Sonnet 4.5 (고정)
- **Prompt Caching**: 5분 TTL, 반복 호출 시 90% 비용 절감
- **헤더**: `anthropic-dangerous-direct-browser-access: true` (브라우저 직접 호출용)

## 보안 고려사항

- API 키는 클라이언트에서 사용되므로 내부용/개인용으로만 배포
- **필수**: [Anthropic Console](https://console.anthropic.com/settings/limits)에서 **Spend Limit** 설정
- 외부 공개 시 백엔드 프록시 구현 권장 (장기 계획)

## GitHub Pages 배포

### 사전 준비

1. **Anthropic Console에서 Spend Limit 설정** (필수)
   - [Settings → Limits](https://console.anthropic.com/settings/limits)에서 월간 지출 한도 설정
   - 권장: $10~20/월

2. **GitHub Repository Secrets 설정**
   - Repository → Settings → Secrets and variables → Actions
   - `ANTHROPIC_API_KEY` secret 추가

### 배포 방법

1. **GitHub Pages 활성화**
   - Repository → Settings → Pages
   - Source: "GitHub Actions" 선택

2. **자동 배포**
   - `main` 브랜치에 push하면 자동으로 GitHub Pages에 배포
   - `.github/workflows/deploy.yml` 참조

### 배포 후 확인

- `https://<username>.github.io/<repo-name>/` 에서 접속 확인
- 입력 시 실시간 모드 표시(생성/변환) 확인
- API 호출이 정상 작동하는지 테스트

## 프로젝트 구조

```
/
├── index.html              # 메인 HTML (SPA 엔트리포인트)
├── css/
│   └── style.css           # Slack 브랜드 컬러 기반 스타일
├── js/
│   ├── env.js              # API 키 설정 (gitignored)
│   ├── env.example.js      # env.js 템플릿
│   ├── config.js           # 앱 설정 (모델 선택 등)
│   ├── api.js              # Claude API 통신 모듈
│   └── app.js              # 메인 앱 로직, 이벤트 핸들러
├── prompts/
│   ├── rulebook.md         # 변환 모드 규칙 (시스템 프롬프트)
│   ├── generator.md        # 생성 모드 규칙 (시스템 프롬프트)
│   └── reference.md        # 실제 공지 샘플 (참고용, API 미사용)
└── .github/
    └── workflows/
        ├── deploy.yml      # GitHub Pages 자동 배포
        └── claude.yml      # Claude Code Action
```

<!-- MANUAL: 추가 메모는 아래에 작성 -->
