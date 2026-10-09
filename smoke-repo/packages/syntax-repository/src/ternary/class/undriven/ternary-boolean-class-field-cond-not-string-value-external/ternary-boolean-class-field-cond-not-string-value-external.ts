export class TernaryBooleanClassFieldCondNotStringValueExternal {
    public label = !(process.argv[2] ?? '') ? 'then' : 'else';
}
