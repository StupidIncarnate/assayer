const receiver: string = 'abc';

export class IfNumberClassGetterCondStringLengthReceiverConst {
    public get result(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
