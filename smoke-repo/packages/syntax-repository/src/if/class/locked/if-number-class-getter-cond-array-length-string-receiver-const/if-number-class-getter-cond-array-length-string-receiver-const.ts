const receiver: readonly string[] = ['a', 'b', 'c'];

export class IfNumberClassGetterCondArrayLengthStringReceiverConst {
    public get result(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
