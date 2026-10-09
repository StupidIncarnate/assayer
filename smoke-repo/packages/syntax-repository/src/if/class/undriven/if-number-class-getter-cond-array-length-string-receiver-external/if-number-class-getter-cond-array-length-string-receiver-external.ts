export class IfNumberClassGetterCondArrayLengthStringReceiverExternal {
    public get result(): string {
        if (process.argv.slice(2).length) {
            return 'then';
        }
        return 'else';
    }
}
