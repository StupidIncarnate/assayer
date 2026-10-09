export class IfNumberClassStaticMethodCondArrayLengthNumberReceiverParam {
    public static run(receiver: readonly number[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
