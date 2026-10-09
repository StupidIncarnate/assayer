export class TernaryNumberClassGetterCondArrayLengthBooleanReceiverExternal {
    public get result(): string {
        return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
    }
}
