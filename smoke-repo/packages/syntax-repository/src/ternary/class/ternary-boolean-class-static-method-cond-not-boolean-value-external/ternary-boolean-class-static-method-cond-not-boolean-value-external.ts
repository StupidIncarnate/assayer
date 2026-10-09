export class TernaryBooleanClassStaticMethodCondNotBooleanValueExternal {
    public static run(): string {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    }
}
