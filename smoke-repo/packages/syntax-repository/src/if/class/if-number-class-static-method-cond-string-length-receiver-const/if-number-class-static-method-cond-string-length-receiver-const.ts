const receiver: string = 'abc';

export class IfNumberClassStaticMethodCondStringLengthReceiverConst {
    public static run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
