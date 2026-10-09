const receiver: readonly number[] = [10, 20, 30];

export class TernaryNumberClassStaticMethodCondArrayLengthNumberReceiverConst {
    public static run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
