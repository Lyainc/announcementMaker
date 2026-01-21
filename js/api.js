/**
 * API Module
 * Claude API 통신 담당
 */

const API = {
    ENDPOINT: 'https://api.anthropic.com/v1/messages',

    // 프롬프트 파일 캐시
    _promptCache: {
        rulebook: null,
        generator: null
    },

    /**
     * 프롬프트 파일 로드
     */
    async loadPrompts() {
        const loads = [];

        if (!this._promptCache.rulebook) {
            loads.push(
                fetch('prompts/rulebook.md')
                    .then(res => res.ok ? res.text() : Promise.reject(new Error('변환 프롬프트 파일을 불러올 수 없습니다.')))
                    .then(text => this._promptCache.rulebook = text)
            );
        }

        if (!this._promptCache.generator) {
            loads.push(
                fetch('prompts/generator.md')
                    .then(res => res.ok ? res.text() : Promise.reject(new Error('생성 프롬프트 파일을 불러올 수 없습니다.')))
                    .then(text => this._promptCache.generator = text)
            );
        }

        await Promise.all(loads);
        return this._promptCache;
    },

    /**
     * 공지 처리 요청 (변환 또는 생성)
     * @param {string} inputText - 입력 텍스트
     * @param {'convert' | 'generate'} mode - 처리 모드
     * @param {string} additionalInstructions - 추가 요청사항
     */
    async processAnnouncement(inputText, mode, additionalInstructions = '') {
        const apiKey = Config.getApiKey();
        const model = Config.getModel();

        if (!inputText || !inputText.trim()) {
            throw new Error('내용을 입력해주세요.');
        }

        // 프롬프트 로드
        const prompts = await this.loadPrompts();

        // 모드별 프롬프트 선택
        const systemPrompt = mode === 'generate'
            ? prompts.generator
            : prompts.rulebook;

        const userPrompt = mode === 'generate'
            ? `다음 내용을 바탕으로 Slack 전사 공지를 작성해주세요. 완성된 공지만 출력하고, 설명이나 부연은 포함하지 마세요.${additionalInstructions ? `\n\n[추가 요청사항]\n${additionalInstructions}` : ''}\n\n---\n\n${inputText}`
            : `다음 공지를 Slack 전사 공지 채널에 적합한 형태로 변환해주세요. 변환된 공지만 출력하고, 설명이나 부연은 포함하지 마세요.${additionalInstructions ? `\n\n[추가 요청사항]\n${additionalInstructions}` : ''}\n\n---\n\n${inputText}`;

        // API 요청
        const response = await fetch(this.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'prompt-caching-2024-07-31',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                system: [
                    {
                        type: 'text',
                        text: systemPrompt,
                        cache_control: { type: 'ephemeral' }
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;

            if (response.status === 401) {
                throw new Error('API 키가 유효하지 않습니다. 관리자에게 문의해주세요.');
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
