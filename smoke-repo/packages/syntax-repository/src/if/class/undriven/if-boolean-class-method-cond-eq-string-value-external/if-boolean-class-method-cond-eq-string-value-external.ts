export class IfBooleanClassMethodCondEqStringValueExternal {
    public run(): string {
        if ((process.argv[2] ?? '') === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
