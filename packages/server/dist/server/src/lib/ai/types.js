export class AiProviderError extends Error {
    provider;
    status;
    constructor(message, provider, status) {
        super(message);
        this.provider = provider;
        this.status = status;
        this.name = 'AiProviderError';
    }
}
