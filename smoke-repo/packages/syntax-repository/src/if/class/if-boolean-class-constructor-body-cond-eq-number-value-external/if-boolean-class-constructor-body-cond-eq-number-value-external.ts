export class IfBooleanClassConstructorBodyCondEqNumberValueExternal {
    public constructor() {
        if (Number(process.argv[2]) === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
