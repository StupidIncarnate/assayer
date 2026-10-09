export class TernaryNumberClassConstructorBodyCondStringLengthReceiverExternal {
    public constructor() {
        console.log((process.argv[2] ?? '').length ? 'then' : 'else');
    }
}
