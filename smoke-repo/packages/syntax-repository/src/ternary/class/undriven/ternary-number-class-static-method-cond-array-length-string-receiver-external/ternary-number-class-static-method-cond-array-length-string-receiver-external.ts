export class TernaryNumberClassStaticMethodCondArrayLengthStringReceiverExternal {
    public static run(): string {
        return process.argv.slice(2).length ? 'then' : 'else';
    }
}
