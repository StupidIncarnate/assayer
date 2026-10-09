export class TernaryBooleanClassStaticFieldCondNotStringValueExternal {
    public static label = !(process.argv[2] ?? '') ? 'then' : 'else';
}
