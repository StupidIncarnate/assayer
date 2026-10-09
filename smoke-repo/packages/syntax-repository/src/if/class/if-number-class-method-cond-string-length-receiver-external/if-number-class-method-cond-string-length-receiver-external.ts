export class IfNumberClassMethodCondStringLengthReceiverExternal {
    public run(): string {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    }
}
