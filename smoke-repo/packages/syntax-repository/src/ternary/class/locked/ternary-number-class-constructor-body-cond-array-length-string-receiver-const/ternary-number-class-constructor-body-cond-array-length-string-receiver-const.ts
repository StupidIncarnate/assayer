const receiver: readonly string[] = ['a', 'b', 'c'];

export class TernaryNumberClassConstructorBodyCondArrayLengthStringReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
