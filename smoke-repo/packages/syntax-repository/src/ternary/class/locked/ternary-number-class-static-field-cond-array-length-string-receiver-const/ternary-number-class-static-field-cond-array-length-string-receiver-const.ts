const receiver: readonly string[] = ['a', 'b', 'c'];

export class TernaryNumberClassStaticFieldCondArrayLengthStringReceiverConst {
    public static label = receiver.length ? 'then' : 'else';
}
