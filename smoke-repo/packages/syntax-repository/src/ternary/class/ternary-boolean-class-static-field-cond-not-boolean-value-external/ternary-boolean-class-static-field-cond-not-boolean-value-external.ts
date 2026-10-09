export class TernaryBooleanClassStaticFieldCondNotBooleanValueExternal {
    public static label = !(process.argv[2] === 'yes') ? 'then' : 'else';
}
