const receiver: readonly number[] = [10, 20, 30];

export class TernaryNumberClassConstructorBodyCondArrayLengthNumberReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
