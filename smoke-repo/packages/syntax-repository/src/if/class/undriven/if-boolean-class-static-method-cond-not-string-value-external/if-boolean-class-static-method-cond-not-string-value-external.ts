export class IfBooleanClassStaticMethodCondNotStringValueExternal {
    public static run(): string {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    }
}
