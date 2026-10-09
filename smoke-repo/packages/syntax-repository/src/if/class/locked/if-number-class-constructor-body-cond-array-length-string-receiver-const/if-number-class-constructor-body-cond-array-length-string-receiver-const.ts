const receiver: readonly string[] = ['a', 'b', 'c'];

export class IfNumberClassConstructorBodyCondArrayLengthStringReceiverConst {
    public constructor() {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
