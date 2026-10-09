export class TernaryBooleanClassFieldCondNullishBooleanValueExternal {
    public label = (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
}
