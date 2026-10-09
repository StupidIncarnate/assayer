export class TernaryBooleanClassMethodCondGtStringValueExternal {
    public run(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
