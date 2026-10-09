export class IfBooleanClassConstructorBodyCondNotBooleanValueExternal {
    public constructor() {
        if (!(process.argv[2] === 'yes')) {
            console.log('then');
        }
        console.log('else');
    }
}
