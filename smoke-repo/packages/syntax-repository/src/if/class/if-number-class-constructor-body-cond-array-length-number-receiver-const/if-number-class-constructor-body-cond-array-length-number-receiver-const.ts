const receiver: readonly number[] = [10, 20, 30];

export class IfNumberClassConstructorBodyCondArrayLengthNumberReceiverConst {
    public constructor() {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
