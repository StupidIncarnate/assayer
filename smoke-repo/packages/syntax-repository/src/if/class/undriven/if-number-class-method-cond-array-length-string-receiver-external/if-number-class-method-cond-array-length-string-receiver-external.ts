export class IfNumberClassMethodCondArrayLengthStringReceiverExternal {
    public run(): string {
        if (process.argv.slice(2).length) {
            return 'then';
        }
        return 'else';
    }
}
