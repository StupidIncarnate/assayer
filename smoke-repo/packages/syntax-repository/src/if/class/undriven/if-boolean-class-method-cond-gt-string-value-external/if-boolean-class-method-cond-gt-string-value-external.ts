export class IfBooleanClassMethodCondGtStringValueExternal {
    public run(): string {
        if ((process.argv[2] ?? '') > 'm') {
            return 'then';
        }
        return 'else';
    }
}
