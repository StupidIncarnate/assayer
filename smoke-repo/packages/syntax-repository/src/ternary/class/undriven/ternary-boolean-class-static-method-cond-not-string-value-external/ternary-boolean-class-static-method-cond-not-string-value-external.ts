export class TernaryBooleanClassStaticMethodCondNotStringValueExternal {
    public static run(): string {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    }
}
