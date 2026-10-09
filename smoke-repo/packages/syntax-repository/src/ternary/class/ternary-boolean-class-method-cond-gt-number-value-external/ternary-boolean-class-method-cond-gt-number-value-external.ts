export class TernaryBooleanClassMethodCondGtNumberValueExternal {
    public run(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    }
}
