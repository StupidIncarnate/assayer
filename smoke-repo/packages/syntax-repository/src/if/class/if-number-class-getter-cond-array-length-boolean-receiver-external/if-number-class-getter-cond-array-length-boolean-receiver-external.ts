export class IfNumberClassGetterCondArrayLengthBooleanReceiverExternal {
    public get result(): string {
        if (process.argv.slice(2).map(arg => arg === 'yes').length) {
            return 'then';
        }
        return 'else';
    }
}
