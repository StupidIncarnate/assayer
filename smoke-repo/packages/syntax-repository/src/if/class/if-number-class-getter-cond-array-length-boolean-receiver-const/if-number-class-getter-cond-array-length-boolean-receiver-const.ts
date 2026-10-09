const receiver: readonly boolean[] = [true, false, true];

export class IfNumberClassGetterCondArrayLengthBooleanReceiverConst {
    public get result(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
