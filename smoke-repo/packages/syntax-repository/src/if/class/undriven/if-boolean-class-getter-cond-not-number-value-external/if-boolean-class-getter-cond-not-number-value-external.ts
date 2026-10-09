export class IfBooleanClassGetterCondNotNumberValueExternal {
    public get result(): string {
        if (!Number(process.argv[2])) {
            return 'then';
        }
        return 'else';
    }
}
