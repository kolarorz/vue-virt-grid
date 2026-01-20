type EventListener = (...args: any[]) => void;
export declare class EventEmitter {
    private events;
    on(event: string, listener: EventListener): void;
    off(event: string, listener: EventListener): void;
    emit(event: string, ...args: any[]): void;
    once(event: string, listener: EventListener): void;
    offAll(): void;
}
export {};
