const receiver: string = 'abc';

export class TernaryNumberClassStaticMethodCondStringLengthReceiverConst {
    public static run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
