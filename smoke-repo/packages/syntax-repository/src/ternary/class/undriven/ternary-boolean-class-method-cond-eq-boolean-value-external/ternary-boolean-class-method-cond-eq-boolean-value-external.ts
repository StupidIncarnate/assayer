export class TernaryBooleanClassMethodCondEqBooleanValueExternal {
    public run(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    }
}
