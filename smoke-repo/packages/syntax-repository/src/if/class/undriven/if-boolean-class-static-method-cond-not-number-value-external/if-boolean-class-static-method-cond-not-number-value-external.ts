export class IfBooleanClassStaticMethodCondNotNumberValueExternal {
    public static run(): string {
        if (!Number(process.argv[2])) {
            return 'then';
        }
        return 'else';
    }
}
