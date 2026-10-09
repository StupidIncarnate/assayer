export class IfBooleanClassStaticMethodCondEqBooleanValueExternal {
    public static run(): string {
        if (process.argv[2] === 'yes' === false) {
            return 'then';
        }
        return 'else';
    }
}
