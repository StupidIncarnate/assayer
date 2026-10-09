const receiver: readonly boolean[] = [true, false, true];

export class IfNumberClassStaticMethodCondArrayLengthBooleanReceiverConst {
    public static run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
