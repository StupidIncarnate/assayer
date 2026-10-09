export class IfNumberClassGetterCondStringLengthReceiverExternal {
    public get result(): string {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    }
}
