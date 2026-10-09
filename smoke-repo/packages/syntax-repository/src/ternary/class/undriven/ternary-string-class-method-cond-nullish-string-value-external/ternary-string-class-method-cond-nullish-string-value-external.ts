export class TernaryStringClassMethodCondNullishStringValueExternal {
    public run(): string {
        return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
    }
}
