export class TernaryNumberClassStaticFieldCondArrayLengthBooleanReceiverExternal {
    public static label = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
