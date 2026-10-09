export class IfBooleanClassConstructorBodyCondEqBooleanValueExternal {
    public constructor() {
        if (process.argv[2] === 'yes' === false) {
            console.log('then');
        }
        console.log('else');
    }
}
