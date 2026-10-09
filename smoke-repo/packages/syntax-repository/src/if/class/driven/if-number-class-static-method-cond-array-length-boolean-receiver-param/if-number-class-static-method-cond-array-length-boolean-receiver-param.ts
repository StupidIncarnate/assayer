export class IfNumberClassStaticMethodCondArrayLengthBooleanReceiverParam {
    public static run(receiver: readonly boolean[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
