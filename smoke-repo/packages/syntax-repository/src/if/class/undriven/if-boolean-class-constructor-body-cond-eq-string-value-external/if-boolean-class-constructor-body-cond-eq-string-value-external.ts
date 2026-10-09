export class IfBooleanClassConstructorBodyCondEqStringValueExternal {
    public constructor() {
        if ((process.argv[2] ?? '') === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
