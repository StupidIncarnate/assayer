const receiver: readonly boolean[] = [true, false, true];

export class IfNumberClassConstructorBodyCondArrayLengthBooleanReceiverConst {
    public constructor() {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
