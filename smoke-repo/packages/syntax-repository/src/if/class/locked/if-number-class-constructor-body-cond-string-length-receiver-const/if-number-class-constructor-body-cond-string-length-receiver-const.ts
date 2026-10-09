const receiver: string = 'abc';

export class IfNumberClassConstructorBodyCondStringLengthReceiverConst {
    public constructor() {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
