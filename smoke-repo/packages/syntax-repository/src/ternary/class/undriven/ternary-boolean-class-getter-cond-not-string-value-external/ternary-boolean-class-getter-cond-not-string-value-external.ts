export class TernaryBooleanClassGetterCondNotStringValueExternal {
    public get result(): string {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    }
}
