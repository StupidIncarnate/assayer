export class TernaryBooleanClassGetterCondNullishBooleanValueExternal {
    public get result(): string {
        return (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
    }
}
