export class TernaryBooleanClassStaticFieldCondEqStringValueExternal {
    public static label = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
