# Slack 공지 변환기

인사팀의 정책/안내사항을 Slack 전사 공지 채널에 적합한 형태로 변환하는 웹 애플리케이션.

## 기술 스택

- **Frontend**: Pure HTML/CSS/JavaScript (빌드 도구 없음)
- **API**: Anthropic Claude API (브라우저에서 직접 호출)
- **배포**: 정적 파일 호스팅 (GitHub Pages 등)

## 프로젝트 구조

```
/
├── index.html          # 메인 HTML (SPA 엔트리포인트)
├── css/
│   └── style.css       # Slack 브랜드 컬러 기반 스타일
├── js/
│   ├── env.js          # API 키 설정 (gitignored)
│   ├── env.example.js  # env.js 템플릿
│   ├── config.js       # 앱 설정 (모델 선택 등)
│   ├── api.js          # Claude API 통신 모듈
│   └── app.js          # 메인 앱 로직, 이벤트 핸들러
└── prompts/
    ├── rulebook.md     # 변환 규칙 및 예시 (시스템 프롬프트)
    └── reference.md    # 실제 공지 샘플 (참고용, API 미사용)
```

## 핵심 파일 설명

| 파일 | 역할 |
|------|------|
| `js/env.js` | Anthropic API 키 저장 (절대 커밋하지 말 것) |
| `js/api.js` | API 호출, 프롬프트 캐싱 적용 |
| `prompts/rulebook.md` | Slack 마크다운 규칙, 톤앤매너, 예시 포함 |

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
1. 원본 공지 입력
2. 변환 버튼 클릭
3. Slack에 붙여넣기하여 렌더링 확인

## API 사용

- **모델**: Claude Sonnet 4.5 (고정)
- **Prompt Caching**: 5분 TTL, 반복 호출 시 90% 비용 절감
- **헤더**: `anthropic-dangerous-direct-browser-access: true` (브라우저 직접 호출용)

## 보안 고려사항

- API 키는 클라이언트에서 사용되므로 내부용/개인용으로만 배포
- 외부 공개 시 백엔드 프록시 구현 필요

<!-- MANUAL: 추가 메모는 아래에 작성 -->
