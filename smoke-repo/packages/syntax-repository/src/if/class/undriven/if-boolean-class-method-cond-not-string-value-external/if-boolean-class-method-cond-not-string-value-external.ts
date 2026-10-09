export class IfBooleanClassMethodCondNotStringValueExternal {
    public run(): string {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    }
}
