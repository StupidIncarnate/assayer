export class IfNumberClassMethodCondArrayLengthStringReceiverParam {
    public run(receiver: readonly string[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
