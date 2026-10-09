export class TernaryBooleanClassMethodCondNotNumberValueExternal {
    public run(): string {
        return !Number(process.argv[2]) ? 'then' : 'else';
    }
}
