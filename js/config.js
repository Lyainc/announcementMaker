/**
 * Config Module
 * API 설정 관리 (env.js에서 값 로드)
 */

const Config = {
    API_KEY: ENV.ANTHROPIC_API_KEY,
    MODEL: 'claude-sonnet-4-5-20250929',

    /**
     * API 키 가져오기
     */
    getApiKey() {
        return this.API_KEY;
    },

    /**
     * 모델 가져오기
     */
    getModel() {
        return this.MODEL;
    }
};
