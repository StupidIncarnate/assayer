export class TernaryBooleanClassMethodCondNotStringValueExternal {
    public run(): string {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    }
}
