export class TernaryBooleanClassGetterCondNotBooleanValueExternal {
    public get result(): string {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    }
}
