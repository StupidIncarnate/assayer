export class TernaryStringClassGetterCondNullishStringValueExternal {
    public get result(): string {
        return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
    }
}
