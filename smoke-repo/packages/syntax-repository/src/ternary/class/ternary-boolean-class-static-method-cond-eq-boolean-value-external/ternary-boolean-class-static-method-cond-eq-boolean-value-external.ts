export class TernaryBooleanClassStaticMethodCondEqBooleanValueExternal {
    public static run(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    }
}
