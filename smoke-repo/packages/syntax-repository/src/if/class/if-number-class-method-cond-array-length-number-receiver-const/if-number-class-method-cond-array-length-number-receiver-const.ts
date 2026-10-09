const receiver: readonly number[] = [10, 20, 30];

export class IfNumberClassMethodCondArrayLengthNumberReceiverConst {
    public run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
