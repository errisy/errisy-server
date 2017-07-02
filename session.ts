export interface ISession {
    put(key: string, value: string, expiryTime?: number): Promise<void>;
    get(key: string): Promise<string>;
    delete(key: string): Promise<void>;
    flush(): Promise<void>;
    flash(key: string, value: string, expiryTime?: number): Promise<void>;
    reflash(): Promise<void>;
}