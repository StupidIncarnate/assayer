export class IfNumberClassConstructorBodyCondArrayLengthStringReceiverParam {
    public constructor(receiver: readonly string[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
