export class IfBooleanClassConstructorBodyCondGtStringValueExternal {
    public constructor() {
        if ((process.argv[2] ?? '') > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
