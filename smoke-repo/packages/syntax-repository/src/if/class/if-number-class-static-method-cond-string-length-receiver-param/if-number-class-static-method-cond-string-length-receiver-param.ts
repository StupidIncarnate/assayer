export class IfNumberClassStaticMethodCondStringLengthReceiverParam {
    public static run(receiver: string): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
