export class TernaryNumberClassMethodCondArrayLengthNumberReceiverExternal {
    public run(): string {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    }
}
