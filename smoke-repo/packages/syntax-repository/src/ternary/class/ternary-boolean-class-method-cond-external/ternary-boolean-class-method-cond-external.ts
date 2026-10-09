export class TernaryBooleanClassMethodCondExternal {
    public run(): string {
        return process.argv[2] === 'yes' ? 'then' : 'else';
    }
}
