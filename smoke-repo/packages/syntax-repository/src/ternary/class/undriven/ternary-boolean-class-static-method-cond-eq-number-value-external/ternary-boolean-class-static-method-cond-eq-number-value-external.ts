export class TernaryBooleanClassStaticMethodCondEqNumberValueExternal {
    public static run(): string {
        return Number(process.argv[2]) === 7 ? 'then' : 'else';
    }
}
