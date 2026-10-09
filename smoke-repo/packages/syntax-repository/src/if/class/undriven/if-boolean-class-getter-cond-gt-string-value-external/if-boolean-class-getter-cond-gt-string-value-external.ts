export class IfBooleanClassGetterCondGtStringValueExternal {
    public get result(): string {
        if ((process.argv[2] ?? '') > 'm') {
            return 'then';
        }
        return 'else';
    }
}
