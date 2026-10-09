export class TernaryBooleanClassStaticMethodCondEqStringValueExternal {
    public static run(): string {
        return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
    }
}
