export class TernaryNumberClassGetterCondArrayLengthStringReceiverExternal {
    public get result(): string {
        return process.argv.slice(2).length ? 'then' : 'else';
    }
}
