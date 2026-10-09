const receiver: readonly string[] = ['a', 'b', 'c'];

export class TernaryNumberClassStaticMethodCondArrayLengthStringReceiverConst {
    public static run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
