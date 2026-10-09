export class IfNumberClassConstructorBodyCondStringLengthReceiverExternal {
    public constructor() {
        if ((process.argv[2] ?? '').length) {
            console.log('then');
        }
        console.log('else');
    }
}
