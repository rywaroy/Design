declare const _default: () => {
    app: {
        port: number;
        nodeEnv: string;
        baseUrl: string;
    };
    file: {
        maxSizeMB: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    mongodb: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        database: number;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    ai: {
        baseUrl: string;
        apiKey: string;
        model: string;
        imageModel: string;
        timeoutMs: number;
    };
};
export default _default;
