export class IfNumberClassGetterCondArrayLengthNumberReceiverExternal {
    public get result(): string {
        if (process.argv.slice(2).map(Number).length) {
            return 'then';
        }
        return 'else';
    }
}
