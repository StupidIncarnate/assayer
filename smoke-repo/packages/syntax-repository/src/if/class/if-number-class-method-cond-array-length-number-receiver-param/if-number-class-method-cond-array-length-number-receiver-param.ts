export class IfNumberClassMethodCondArrayLengthNumberReceiverParam {
    public run(receiver: readonly number[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
