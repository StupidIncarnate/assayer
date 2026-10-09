export class IfNumberClassConstructorBodyCondArrayLengthNumberReceiverParam {
    public constructor(receiver: readonly number[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
