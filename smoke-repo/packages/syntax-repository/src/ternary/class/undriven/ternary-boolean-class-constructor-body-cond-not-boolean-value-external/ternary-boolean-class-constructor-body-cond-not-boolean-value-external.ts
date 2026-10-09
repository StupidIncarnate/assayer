export class TernaryBooleanClassConstructorBodyCondNotBooleanValueExternal {
    public constructor() {
        console.log(!(process.argv[2] === 'yes') ? 'then' : 'else');
    }
}
