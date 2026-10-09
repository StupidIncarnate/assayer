export class IfBooleanClassMethodCondEqBooleanValueExternal {
    public run(): string {
        if (process.argv[2] === 'yes' === false) {
            return 'then';
        }
        return 'else';
    }
}
