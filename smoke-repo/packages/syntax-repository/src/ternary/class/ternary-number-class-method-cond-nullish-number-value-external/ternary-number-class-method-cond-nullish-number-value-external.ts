export class TernaryNumberClassMethodCondNullishNumberValueExternal {
    public run(): string {
        return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
    }
}
