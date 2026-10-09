export class TernaryNumberClassConstructorBodyCondArrayLengthNumberReceiverParam {
    public constructor(receiver: readonly number[]) {
        console.log(receiver.length ? 'then' : 'else');
    }
}
