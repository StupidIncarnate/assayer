export class TernaryNumberClassConstructorBodyCondArrayLengthNumberReceiverExternal {
    public constructor() {
        console.log(process.argv.slice(2).map(Number).length ? 'then' : 'else');
    }
}
