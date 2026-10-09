export class TernaryNumberClassConstructorBodyCondArrayLengthStringReceiverParam {
    public constructor(receiver: readonly string[]) {
        console.log(receiver.length ? 'then' : 'else');
    }
}
