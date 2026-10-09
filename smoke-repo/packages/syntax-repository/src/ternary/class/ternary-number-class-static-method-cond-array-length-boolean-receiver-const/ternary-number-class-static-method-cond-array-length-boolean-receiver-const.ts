const receiver: readonly boolean[] = [true, false, true];

export class TernaryNumberClassStaticMethodCondArrayLengthBooleanReceiverConst {
    public static run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
