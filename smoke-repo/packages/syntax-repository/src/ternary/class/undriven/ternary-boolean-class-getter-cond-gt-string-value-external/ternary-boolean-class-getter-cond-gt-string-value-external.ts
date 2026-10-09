export class TernaryBooleanClassGetterCondGtStringValueExternal {
    public get result(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
