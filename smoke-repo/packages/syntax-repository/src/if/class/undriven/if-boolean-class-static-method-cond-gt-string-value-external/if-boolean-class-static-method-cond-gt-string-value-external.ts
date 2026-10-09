export class IfBooleanClassStaticMethodCondGtStringValueExternal {
    public static run(): string {
        if ((process.argv[2] ?? '') > 'm') {
            return 'then';
        }
        return 'else';
    }
}
