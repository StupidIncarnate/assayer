const receiver: string = 'abc';

export class TernaryNumberClassGetterCondStringLengthReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
