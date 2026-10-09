export class IfNumberClassConstructorBodyCondArrayLengthStringReceiverExternal {
    public constructor() {
        if (process.argv.slice(2).length) {
            console.log('then');
        }
        console.log('else');
    }
}
