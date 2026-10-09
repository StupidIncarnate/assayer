export class IfStringClassConstructorBodyCondNullishStringValueExternal {
    public constructor() {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
