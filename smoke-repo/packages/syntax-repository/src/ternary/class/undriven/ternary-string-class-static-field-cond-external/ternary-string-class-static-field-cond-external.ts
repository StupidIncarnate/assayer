export class TernaryStringClassStaticFieldCondExternal {
    public static label = process.argv[2] ?? '' ? 'then' : 'else';
}
