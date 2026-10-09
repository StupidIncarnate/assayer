export class IfNumberClassMethodCondArrayLengthBooleanReceiverParam {
    public run(receiver: readonly boolean[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
