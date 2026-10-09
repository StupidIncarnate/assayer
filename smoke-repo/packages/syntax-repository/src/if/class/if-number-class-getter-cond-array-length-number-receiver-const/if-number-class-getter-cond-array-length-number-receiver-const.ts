const receiver: readonly number[] = [10, 20, 30];

export class IfNumberClassGetterCondArrayLengthNumberReceiverConst {
    public get result(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
