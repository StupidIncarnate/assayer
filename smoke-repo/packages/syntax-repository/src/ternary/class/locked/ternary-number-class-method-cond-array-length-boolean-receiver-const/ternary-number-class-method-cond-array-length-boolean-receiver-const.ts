const receiver: readonly boolean[] = [true, false, true];

export class TernaryNumberClassMethodCondArrayLengthBooleanReceiverConst {
    public run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
