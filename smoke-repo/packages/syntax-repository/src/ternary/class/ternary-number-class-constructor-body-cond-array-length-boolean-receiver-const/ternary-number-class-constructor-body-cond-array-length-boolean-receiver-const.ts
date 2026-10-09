const receiver: readonly boolean[] = [true, false, true];

export class TernaryNumberClassConstructorBodyCondArrayLengthBooleanReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
