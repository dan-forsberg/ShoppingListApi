export class ListNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ListNotFoundError";
    }
}

export class ListItemNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ListItemNotFoundError";
    }
}