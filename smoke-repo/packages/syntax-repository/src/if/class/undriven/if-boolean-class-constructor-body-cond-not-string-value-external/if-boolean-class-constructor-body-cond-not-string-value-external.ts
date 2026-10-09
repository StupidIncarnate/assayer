export class IfBooleanClassConstructorBodyCondNotStringValueExternal {
    public constructor() {
        if (!(process.argv[2] ?? '')) {
            console.log('then');
        }
        console.log('else');
    }
}
