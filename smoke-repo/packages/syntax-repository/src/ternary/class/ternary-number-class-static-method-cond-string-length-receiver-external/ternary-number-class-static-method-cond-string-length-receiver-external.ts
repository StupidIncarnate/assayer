export class TernaryNumberClassStaticMethodCondStringLengthReceiverExternal {
    public static run(): string {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    }
}
