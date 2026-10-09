export class IfNumberClassStaticMethodCondStringLengthReceiverExternal {
    public static run(): string {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    }
}
