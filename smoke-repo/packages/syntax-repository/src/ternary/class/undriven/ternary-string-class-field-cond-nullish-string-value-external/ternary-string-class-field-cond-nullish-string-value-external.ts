export class TernaryStringClassFieldCondNullishStringValueExternal {
    public label = (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
