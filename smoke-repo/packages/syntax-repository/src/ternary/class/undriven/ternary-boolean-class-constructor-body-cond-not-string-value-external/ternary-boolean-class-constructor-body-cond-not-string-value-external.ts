export class TernaryBooleanClassConstructorBodyCondNotStringValueExternal {
    public constructor() {
        console.log(!(process.argv[2] ?? '') ? 'then' : 'else');
    }
}
