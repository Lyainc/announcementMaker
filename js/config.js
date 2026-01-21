/**
 * Config Module
 * localStorage 기반 API 키 및 설정 관리
 */

const Config = {
    STORAGE_KEY: 'announcement_maker_config',

    DEFAULT_CONFIG: {
        apiKey: '',
        model: 'claude-sonnet-4-20250514'
    },

    /**
     * 설정 불러오기
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        }
        return { ...this.DEFAULT_CONFIG };
    },

    /**
     * 설정 저장
     */
    save(config) {
        try {
            const toSave = {
                apiKey: config.apiKey || '',
                model: config.model || this.DEFAULT_CONFIG.model
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
            return true;
        } catch (e) {
            console.error('Failed to save config:', e);
            return false;
        }
    },

    /**
     * API 키 가져오기
     */
    getApiKey() {
        return this.load().apiKey;
    },

    /**
     * 모델 가져오기
     */
    getModel() {
        return this.load().model;
    },

    /**
     * API 키 유효성 검사 (기본 형식 체크)
     */
    isValidApiKey(key) {
        return key && key.startsWith('sk-ant-') && key.length > 20;
    },

    /**
     * 설정 초기화
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
