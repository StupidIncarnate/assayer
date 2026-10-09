const receiver: string = 'abc';

export class IfNumberClassMethodCondStringLengthReceiverConst {
    public run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
