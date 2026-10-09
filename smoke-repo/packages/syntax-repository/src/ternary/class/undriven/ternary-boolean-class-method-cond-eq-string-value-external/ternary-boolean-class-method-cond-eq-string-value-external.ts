export class TernaryBooleanClassMethodCondEqStringValueExternal {
    public run(): string {
        return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
    }
}
