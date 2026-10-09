export class TernaryBooleanClassGetterCondNotNumberValueExternal {
    public get result(): string {
        return !Number(process.argv[2]) ? 'then' : 'else';
    }
}
