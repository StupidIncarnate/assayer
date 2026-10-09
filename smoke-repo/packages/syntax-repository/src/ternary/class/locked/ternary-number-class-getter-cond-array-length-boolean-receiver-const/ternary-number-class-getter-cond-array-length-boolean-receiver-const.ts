const receiver: readonly boolean[] = [true, false, true];

export class TernaryNumberClassGetterCondArrayLengthBooleanReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
