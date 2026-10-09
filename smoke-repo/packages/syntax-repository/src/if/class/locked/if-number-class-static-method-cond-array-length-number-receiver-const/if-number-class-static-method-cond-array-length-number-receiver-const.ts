const receiver: readonly number[] = [10, 20, 30];

export class IfNumberClassStaticMethodCondArrayLengthNumberReceiverConst {
    public static run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
