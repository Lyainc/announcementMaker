<!-- Generated: 2025-01-21 | Updated: 2025-01-21 -->

# Slack 공지 변환기 (announcementMaker)

## Purpose

인사팀의 정책/안내사항을 Slack 전사 공지 채널에 적합한 형태로 변환하는 정적 웹 애플리케이션. 빌드 도구 없이 순수 HTML/CSS/JavaScript로 구성되며, 브라우저에서 직접 Claude API를 호출합니다.

## Key Files

| File | Description |
|------|-------------|
| `index.html` | SPA 엔트리포인트 |
| `CLAUDE.md` | 프로젝트 상세 문서 (배포 가이드 포함) |
| `.gitignore` | env.js 등 민감 파일 제외 설정 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `js/` | JavaScript 모듈 (API, 앱 로직, 설정) |
| `css/` | 스타일시트 (Slack 브랜드 컬러 기반) |
| `prompts/` | Claude 시스템 프롬프트 및 참고 자료 |
| `.github/workflows/` | CI/CD (GitHub Pages 배포, Claude Code Action) |

## For AI Agents

### Working In This Directory

1. **API 키 보안**: `js/env.js`는 gitignored. 절대 커밋하지 말 것
2. **Slack 마크다운**: 표준 Markdown과 다름
   - Bold: `*text*` (not `**text**`)
   - Link: `<URL|text>` (not `[text](URL)`)
3. **빌드 도구 없음**: 파일 직접 수정, 번들링/트랜스파일 불필요

### File Modification Guidelines

| 파일 유형 | 주의사항 |
|-----------|----------|
| `js/api.js` | API 호출 로직. `cache_control` 설정 유지 필요 |
| `js/app.js` | DOM 이벤트 핸들러. 요소 ID 변경 시 HTML 동기화 |
| `prompts/rulebook.md` | 시스템 프롬프트. 토큰 사용량 고려 |
| `css/style.css` | CSS 변수 (`--slack-*`) 활용 |

### Testing Requirements

```bash
# 로컬 서버 실행
python3 -m http.server 8000
# 또는
npx serve .

# 테스트 항목
# 1. 원본 공지 입력 → 변환 버튼 클릭
# 2. 변환 결과 확인
# 3. Slack에 붙여넣기하여 렌더링 검증
```

### Common Patterns

- **모듈 구조**: 전역 객체 패턴 (`API`, `App`, `Config`)
- **상태 관리**: `App.state` 객체에서 관리 (debounceTimer 포함)
- **에러 처리**: `App.showError()` 메서드 사용
- **DOM 캐싱**: `App.elements`에서 참조
- **실시간 모드 감지**: 입력 시 300ms debounce로 생성/변환 모드 자동 표시

## Dependencies

### External

| Package | Purpose |
|---------|---------|
| Anthropic Claude API | LLM 기반 텍스트 변환 |

### Internal References

| 참조 | 설명 |
|------|------|
| `prompts/rulebook.md` → `js/api.js` | 시스템 프롬프트로 로드 |
| `js/env.js` → `js/config.js` | API 키 로드 |
| `js/config.js` → `js/api.js` | 모델/키 설정 참조 |

## Deployment

- **호스팅**: GitHub Pages (정적)
- **CI/CD**: `.github/workflows/deploy.yml`
- **Secret**: `ANTHROPIC_API_KEY` (Repository Secret)
- **보안**: Anthropic Console에서 Spend Limit 설정 필수

## Architecture Notes

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│  index.html ──┬── js/app.js (UI/Event)                  │
│               ├── js/api.js (Claude API 호출)           │
│               ├── js/config.js (설정)                   │
│               └── js/env.js (API Key - gitignored)      │
├─────────────────────────────────────────────────────────┤
│  css/style.css (Slack 브랜드 스타일)                    │
├─────────────────────────────────────────────────────────┤
│  prompts/rulebook.md (시스템 프롬프트)                  │
└─────────────────────────────────────────────────────────┘
         │
         ▼ (Direct Browser Call)
┌─────────────────────────────────────────────────────────┐
│              Anthropic Claude API                        │
│  - anthropic-dangerous-direct-browser-access: true      │
│  - Prompt Caching enabled                               │
└─────────────────────────────────────────────────────────┘
```

<!-- MANUAL: Custom notes can be added below this line -->
