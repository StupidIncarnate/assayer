export class TernaryNumberClassFieldCondArrayLengthBooleanReceiverExternal {
    public label = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
