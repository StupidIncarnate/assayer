const receiver: readonly string[] = ['a', 'b', 'c'];

export class IfNumberClassStaticMethodCondArrayLengthStringReceiverConst {
    public static run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
