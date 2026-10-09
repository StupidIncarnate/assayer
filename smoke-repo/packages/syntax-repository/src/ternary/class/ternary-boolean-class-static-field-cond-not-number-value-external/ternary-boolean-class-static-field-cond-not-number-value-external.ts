export class TernaryBooleanClassStaticFieldCondNotNumberValueExternal {
    public static label = !Number(process.argv[2]) ? 'then' : 'else';
}
