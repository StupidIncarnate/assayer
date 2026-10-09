export class IfNumberClassStaticMethodCondArrayLengthStringReceiverParam {
    public static run(receiver: readonly string[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
