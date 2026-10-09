export class IfBooleanClassGetterCondEqBooleanValueExternal {
    public get result(): string {
        if (process.argv[2] === 'yes' === false) {
            return 'then';
        }
        return 'else';
    }
}
