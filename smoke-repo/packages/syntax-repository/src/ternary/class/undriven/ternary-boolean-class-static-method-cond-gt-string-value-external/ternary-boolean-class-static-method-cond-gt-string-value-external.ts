export class TernaryBooleanClassStaticMethodCondGtStringValueExternal {
    public static run(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
