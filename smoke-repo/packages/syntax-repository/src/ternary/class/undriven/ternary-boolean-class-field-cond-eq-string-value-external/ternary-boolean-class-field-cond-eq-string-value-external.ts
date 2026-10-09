export class TernaryBooleanClassFieldCondEqStringValueExternal {
    public label = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
