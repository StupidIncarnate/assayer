export class IfBooleanClassConstructorBodyCondNotNumberValueExternal {
    public constructor() {
        if (!Number(process.argv[2])) {
            console.log('then');
        }
        console.log('else');
    }
}
