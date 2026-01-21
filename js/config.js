/**
 * Config Module
 * API 설정 관리 (하드코딩된 값 사용)
 */

const Config = {
    API_KEY: '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',
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
