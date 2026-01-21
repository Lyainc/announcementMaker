/**
 * App Module
 * 메인 앱 로직, 이벤트 핸들러, 상태 관리
 */

const App = {
    // DOM 요소 참조
    elements: {},

    // 상태
    state: {
        isConverting: false,
        hasOutput: false
    },

    /**
     * 초기화
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateCharCount('input');
    },

    /**
     * DOM 요소 캐시
     */
    cacheElements() {
        this.elements = {
            // 에디터 관련
            inputText: document.getElementById('input-text'),
            outputText: document.getElementById('output-text'),
            additionalInstructions: document.getElementById('additional-instructions'),
            inputCount: document.getElementById('input-count'),
            outputCount: document.getElementById('output-count'),

            // 버튼 관련
            convertBtn: document.getElementById('convert-btn'),
            copyBtn: document.getElementById('copy-btn'),
            inlineCopyBtn: document.getElementById('inline-copy-btn'),

            // 메시지
            errorMessage: document.getElementById('error-message'),

            // 모드 표시
            modeIndicator: document.getElementById('mode-indicator')
        };
    },

    /**
     * 입력 텍스트 분석하여 모드 판별
     * @param {string} text - 입력 텍스트
     * @returns {'convert' | 'generate'}
     */
    detectMode(text) {
        const trimmed = text.trim();

        // 빈 텍스트는 generate
        if (!trimmed) return 'generate';

        // 구조 마커 (완성된 공지의 특징)
        const structureMarkers = [
            /안녕하세요/,
            /감사합니다/,
            /문의.*주시/,
            /@channel|@here/,
            /\[.+\].*\n/,      // 섹션 헤더 + 줄바꿈
            /<.+>.*@/,          // 제목 + 멘션
        ];

        const markerCount = structureMarkers.filter(m => m.test(trimmed)).length;
        const lineCount = (trimmed.match(/\n/g) || []).length + 1;

        // 변환 모드 조건:
        // 1. 200자 이상
        // 2. 4줄 이상
        // 3. 구조 마커 2개 이상
        if (trimmed.length >= 200 || lineCount >= 4 || markerCount >= 2) {
            return 'convert';
        }

        return 'generate';
    },

    /**
     * 현재 모드를 UI에 표시
     * @param {'convert' | 'generate'} mode
     */
    showCurrentMode(mode) {
        const indicator = this.elements.modeIndicator;
        if (!indicator) return;

        const modeText = mode === 'generate' ? '생성' : '변환';

        // 텍스트 업데이트
        indicator.textContent = modeText;

        // 클래스 토글 (스타일링용)
        indicator.classList.remove('generate', 'convert');
        indicator.classList.add(mode);

        // 표시
        indicator.classList.remove('hidden');
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 입력 관련
        this.elements.inputText.addEventListener('input', () => this.updateCharCount('input'));
        this.elements.outputText.addEventListener('input', () => this.updateCharCount('output'));

        // 변환/복사 버튼
        this.elements.convertBtn.addEventListener('click', () => this.convert());
        this.elements.copyBtn.addEventListener('click', () => this.copyOutput());
        this.elements.inlineCopyBtn.addEventListener('click', () => this.copyOutputInline());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    },

    /**
     * 글자 수 업데이트
     */
    updateCharCount(type) {
        const textarea = type === 'input' ? this.elements.inputText : this.elements.outputText;
        const counter = type === 'input' ? this.elements.inputCount : this.elements.outputCount;
        const count = textarea.value.length;
        counter.textContent = `${count.toLocaleString()}자`;
    },

    /**
     * 변환/생성 실행
     */
    async convert() {
        if (this.state.isConverting) return;

        const inputText = this.elements.inputText.value.trim();
        const additionalInstructions = this.elements.additionalInstructions.value.trim();

        if (!inputText) {
            this.showError('내용을 입력해주세요.');
            return;
        }

        // 모드 판별
        const mode = this.detectMode(inputText);
        this.showCurrentMode(mode);

        this.setConvertingState(true);
        this.hideError();

        try {
            const result = await API.processAnnouncement(inputText, mode, additionalInstructions);
            this.elements.outputText.value = result;
            this.updateCharCount('output');
            this.state.hasOutput = true;
            this.elements.copyBtn.disabled = false;
            this.elements.inlineCopyBtn.disabled = false;
        } catch (error) {
            this.showError(error.message);
            console.error('Processing error:', error);
        } finally {
            this.setConvertingState(false);
        }
    },

    /**
     * 변환 중 상태 설정
     */
    setConvertingState(isConverting) {
        this.state.isConverting = isConverting;
        this.elements.convertBtn.disabled = isConverting;

        const btnText = this.elements.convertBtn.querySelector('.btn-text');
        const btnLoading = this.elements.convertBtn.querySelector('.btn-loading');

        if (isConverting) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    },

    /**
     * 결과 복사
     */
    async copyOutput() {
        const output = this.elements.outputText.value;

        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);

            // 복사됨 피드백
            const btnText = this.elements.copyBtn.querySelector('.btn-text');
            const btnCopied = this.elements.copyBtn.querySelector('.btn-copied');

            btnText.classList.add('hidden');
            btnCopied.classList.remove('hidden');

            setTimeout(() => {
                btnText.classList.remove('hidden');
                btnCopied.classList.add('hidden');
            }, 2000);
        } catch (error) {
            this.showError('클립보드에 복사할 수 없습니다.');
            console.error('Copy error:', error);
        }
    },

    /**
     * 인라인 복사 버튼 (패널 헤더)
     */
    async copyOutputInline() {
        const output = this.elements.outputText.value;

        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);

            // 복사됨 피드백
            this.elements.inlineCopyBtn.classList.add('copied');

            setTimeout(() => {
                this.elements.inlineCopyBtn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            this.showError('클립보드에 복사할 수 없습니다.');
            console.error('Copy error:', error);
        }
    },

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    },

    /**
     * 에러 메시지 숨기기
     */
    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    },

    /**
     * 키보드 단축키 처리
     */
    handleKeyboard(e) {
        // Cmd/Ctrl + Enter: 변환
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this.convert();
        }

        // Cmd/Ctrl + Shift + C: 복사 (출력이 있을 때)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
            if (this.state.hasOutput) {
                e.preventDefault();
                this.copyOutput();
            }
        }
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => App.init());
