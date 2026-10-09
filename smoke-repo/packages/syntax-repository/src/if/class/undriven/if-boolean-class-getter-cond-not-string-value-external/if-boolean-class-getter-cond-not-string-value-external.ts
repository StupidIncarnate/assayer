export class IfBooleanClassGetterCondNotStringValueExternal {
    public get result(): string {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    }
}
