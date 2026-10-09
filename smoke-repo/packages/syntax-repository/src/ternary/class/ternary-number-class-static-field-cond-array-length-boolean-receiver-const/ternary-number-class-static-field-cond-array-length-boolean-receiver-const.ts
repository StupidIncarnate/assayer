const receiver: readonly boolean[] = [true, false, true];

export class TernaryNumberClassStaticFieldCondArrayLengthBooleanReceiverConst {
    public static label = receiver.length ? 'then' : 'else';
}
