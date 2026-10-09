export class IfNumberClassMethodCondStringLengthReceiverParam {
    public run(receiver: string): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
