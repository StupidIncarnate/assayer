const receiver: readonly string[] = ['a', 'b', 'c'];

export class IfNumberClassMethodCondArrayLengthStringReceiverConst {
    public run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
