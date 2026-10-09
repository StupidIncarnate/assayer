export class TernaryNumberClassStaticMethodCondArrayLengthNumberReceiverExternal {
    public static run(): string {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    }
}
