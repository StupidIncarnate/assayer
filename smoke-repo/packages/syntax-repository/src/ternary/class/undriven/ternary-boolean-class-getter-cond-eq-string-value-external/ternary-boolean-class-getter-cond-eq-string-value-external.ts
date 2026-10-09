export class TernaryBooleanClassGetterCondEqStringValueExternal {
    public get result(): string {
        return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
    }
}
