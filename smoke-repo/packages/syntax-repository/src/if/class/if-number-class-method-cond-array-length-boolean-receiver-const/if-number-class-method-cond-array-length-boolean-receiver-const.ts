const receiver: readonly boolean[] = [true, false, true];

export class IfNumberClassMethodCondArrayLengthBooleanReceiverConst {
    public run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
