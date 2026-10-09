export class IfNumberClassConstructorBodyCondStringLengthReceiverParam {
    public constructor(receiver: string) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
