export class TernaryNumberClassGetterCondArrayLengthNumberReceiverExternal {
    public get result(): string {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    }
}
