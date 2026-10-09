export class TernaryBooleanClassGetterCondGtNumberValueExternal {
    public get result(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    }
}
