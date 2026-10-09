export class TernaryBooleanClassGetterCondEqNumberValueExternal {
    public get result(): string {
        return Number(process.argv[2]) === 7 ? 'then' : 'else';
    }
}
