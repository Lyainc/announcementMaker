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
        this.loadSavedSettings();
        this.updateCharCount('input');
    },

    /**
     * DOM 요소 캐시
     */
    cacheElements() {
        this.elements = {
            // 설정 관련
            settingsToggle: document.getElementById('settings-toggle'),
            settingsPanel: document.getElementById('settings-panel'),
            apiKeyInput: document.getElementById('api-key'),
            modelSelect: document.getElementById('model-select'),
            saveSettings: document.getElementById('save-settings'),
            cancelSettings: document.getElementById('cancel-settings'),

            // 에디터 관련
            inputText: document.getElementById('input-text'),
            outputText: document.getElementById('output-text'),
            inputCount: document.getElementById('input-count'),
            outputCount: document.getElementById('output-count'),

            // 버튼 관련
            convertBtn: document.getElementById('convert-btn'),
            copyBtn: document.getElementById('copy-btn'),

            // 메시지
            errorMessage: document.getElementById('error-message')
        };
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 설정 토글
        this.elements.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.cancelSettings.addEventListener('click', () => this.toggleSettings(false));

        // 입력 관련
        this.elements.inputText.addEventListener('input', () => this.updateCharCount('input'));
        this.elements.outputText.addEventListener('input', () => this.updateCharCount('output'));

        // 변환/복사 버튼
        this.elements.convertBtn.addEventListener('click', () => this.convert());
        this.elements.copyBtn.addEventListener('click', () => this.copyOutput());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    },

    /**
     * 저장된 설정 불러오기
     */
    loadSavedSettings() {
        const config = Config.load();
        this.elements.apiKeyInput.value = config.apiKey;
        this.elements.modelSelect.value = config.model;
    },

    /**
     * 설정 패널 토글
     */
    toggleSettings(show = null) {
        const isHidden = this.elements.settingsPanel.classList.contains('hidden');
        const shouldShow = show !== null ? show : isHidden;

        if (shouldShow) {
            this.loadSavedSettings();
            this.elements.settingsPanel.classList.remove('hidden');
        } else {
            this.elements.settingsPanel.classList.add('hidden');
        }
    },

    /**
     * 설정 저장
     */
    saveSettings() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        const model = this.elements.modelSelect.value;

        if (apiKey && !Config.isValidApiKey(apiKey)) {
            this.showError('유효하지 않은 API 키 형식입니다. sk-ant-로 시작하는 키를 입력해주세요.');
            return;
        }

        Config.save({ apiKey, model });
        this.toggleSettings(false);
        this.hideError();
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
     * 변환 실행
     */
    async convert() {
        if (this.state.isConverting) return;

        const inputText = this.elements.inputText.value.trim();

        if (!inputText) {
            this.showError('변환할 내용을 입력해주세요.');
            return;
        }

        this.setConvertingState(true);
        this.hideError();

        try {
            const result = await API.convertAnnouncement(inputText);
            this.elements.outputText.value = result;
            this.updateCharCount('output');
            this.state.hasOutput = true;
            this.elements.copyBtn.disabled = false;
        } catch (error) {
            this.showError(error.message);
            console.error('Conversion error:', error);
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

        // Escape: 설정 패널 닫기
        if (e.key === 'Escape') {
            this.toggleSettings(false);
        }
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => App.init());
