export class IfNumberClassConstructorBodyCondArrayLengthBooleanReceiverParam {
    public constructor(receiver: readonly boolean[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
