export class TernaryBooleanClassFieldCondNotNumberValueExternal {
    public label = !Number(process.argv[2]) ? 'then' : 'else';
}
