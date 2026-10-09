export class IfBooleanClassConstructorBodyCondGtNumberValueExternal {
    public constructor() {
        if (Number(process.argv[2]) > 5) {
            console.log('then');
        }
        console.log('else');
    }
}
