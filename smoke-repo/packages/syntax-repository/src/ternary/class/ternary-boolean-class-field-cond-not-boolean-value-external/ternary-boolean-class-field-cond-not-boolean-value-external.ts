export class TernaryBooleanClassFieldCondNotBooleanValueExternal {
    public label = !(process.argv[2] === 'yes') ? 'then' : 'else';
}
