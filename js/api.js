/**
 * API Module
 * Claude API 통신 담당
 */

const API = {
    ENDPOINT: 'https://api.anthropic.com/v1/messages',

    // 프롬프트 파일 캐시
    _promptCache: {
        rulebook: null,
        reference: null
    },

    /**
     * 프롬프트 파일 로드
     */
    async loadPrompts() {
        if (!this._promptCache.rulebook || !this._promptCache.reference) {
            const [rulebookRes, referenceRes] = await Promise.all([
                fetch('prompts/rulebook.md'),
                fetch('prompts/reference.md')
            ]);

            if (!rulebookRes.ok || !referenceRes.ok) {
                throw new Error('프롬프트 파일을 불러올 수 없습니다.');
            }

            this._promptCache.rulebook = await rulebookRes.text();
            this._promptCache.reference = await referenceRes.text();
        }

        return this._promptCache;
    },

    /**
     * 시스템 프롬프트 생성
     */
    buildSystemPrompt(rulebook, reference) {
        return `${rulebook}

---

# 참고: 기존 공지 샘플

아래는 실제 사용된 공지 샘플입니다. 톤앤매너와 형식을 참고하세요.

${reference}`;
    },

    /**
     * 공지 변환 요청
     */
    async convertAnnouncement(inputText) {
        const apiKey = Config.getApiKey();
        const model = Config.getModel();

        if (!apiKey) {
            throw new Error('API 키가 설정되지 않았습니다. 설정 버튼을 클릭하여 API 키를 입력해주세요.');
        }

        if (!Config.isValidApiKey(apiKey)) {
            throw new Error('유효하지 않은 API 키 형식입니다.');
        }

        if (!inputText || !inputText.trim()) {
            throw new Error('변환할 내용을 입력해주세요.');
        }

        // 프롬프트 로드
        const prompts = await this.loadPrompts();
        const systemPrompt = this.buildSystemPrompt(prompts.rulebook, prompts.reference);

        // API 요청
        const response = await fetch(this.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `다음 공지를 Slack 전사 공지 채널에 적합한 형태로 변환해주세요. 변환된 공지만 출력하고, 설명이나 부연은 포함하지 마세요.

---

${inputText}`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;

            if (response.status === 401) {
                throw new Error('API 키가 유효하지 않습니다. 설정에서 올바른 API 키를 입력해주세요.');
            } else if (response.status === 429) {
                throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            } else if (response.status === 400) {
                throw new Error(`잘못된 요청입니다: ${errorMessage}`);
            } else {
                throw new Error(`API 오류 (${response.status}): ${errorMessage}`);
            }
        }

        const data = await response.json();

        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }

        return data.content[0].text;
    }
};
