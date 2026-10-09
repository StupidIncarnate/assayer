const receiver: readonly string[] = ['a', 'b', 'c'];

export class TernaryNumberClassGetterCondArrayLengthStringReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
