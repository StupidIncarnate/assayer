export class IfBooleanClassGetterCondEqStringValueExternal {
    public get result(): string {
        if ((process.argv[2] ?? '') === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
