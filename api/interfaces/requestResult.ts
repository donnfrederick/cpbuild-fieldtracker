export interface RequestResult<T> {
    data: T;
    statusCode: number;
    error: Error | null;
}