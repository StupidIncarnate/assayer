export class TernaryBooleanClassStaticMethodCondGtNumberValueExternal {
    public static run(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    }
}
