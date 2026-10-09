export class TernaryStringClassMethodCondExternal {
    public run(): string {
        return process.argv[2] ?? '' ? 'then' : 'else';
    }
}
