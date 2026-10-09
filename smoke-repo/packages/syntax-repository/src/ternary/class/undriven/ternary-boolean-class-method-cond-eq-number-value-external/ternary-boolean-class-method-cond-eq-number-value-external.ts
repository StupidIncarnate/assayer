export class TernaryBooleanClassMethodCondEqNumberValueExternal {
    public run(): string {
        return Number(process.argv[2]) === 7 ? 'then' : 'else';
    }
}
