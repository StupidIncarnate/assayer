export class TernaryBooleanClassGetterCondEqBooleanValueExternal {
    public get result(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    }
}
