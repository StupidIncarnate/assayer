export class TernaryStringClassGetterCondExternal {
    public get result(): string {
        return process.argv[2] ?? '' ? 'then' : 'else';
    }
}
