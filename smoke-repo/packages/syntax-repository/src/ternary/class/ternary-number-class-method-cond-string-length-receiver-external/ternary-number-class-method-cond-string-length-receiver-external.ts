export class TernaryNumberClassMethodCondStringLengthReceiverExternal {
    public run(): string {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    }
}
