export class IfBooleanClassGetterCondEqNumberValueExternal {
    public get result(): string {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    }
}
