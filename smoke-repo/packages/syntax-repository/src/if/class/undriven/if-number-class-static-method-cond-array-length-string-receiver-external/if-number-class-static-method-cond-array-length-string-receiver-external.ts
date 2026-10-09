export class IfNumberClassStaticMethodCondArrayLengthStringReceiverExternal {
    public static run(): string {
        if (process.argv.slice(2).length) {
            return 'then';
        }
        return 'else';
    }
}
