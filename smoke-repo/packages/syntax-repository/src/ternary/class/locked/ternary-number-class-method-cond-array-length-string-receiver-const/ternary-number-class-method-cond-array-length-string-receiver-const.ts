const receiver: readonly string[] = ['a', 'b', 'c'];

export class TernaryNumberClassMethodCondArrayLengthStringReceiverConst {
    public run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
