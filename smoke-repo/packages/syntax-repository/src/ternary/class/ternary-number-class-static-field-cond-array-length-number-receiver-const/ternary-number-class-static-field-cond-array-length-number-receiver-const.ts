const receiver: readonly number[] = [10, 20, 30];

export class TernaryNumberClassStaticFieldCondArrayLengthNumberReceiverConst {
    public static label = receiver.length ? 'then' : 'else';
}
