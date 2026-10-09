export class TernaryStringClassStaticFieldCondNullishStringValueExternal {
    public static label = (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
