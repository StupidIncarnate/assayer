export class TernaryNumberClassGetterCondStringLengthReceiverExternal {
    public get result(): string {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    }
}
