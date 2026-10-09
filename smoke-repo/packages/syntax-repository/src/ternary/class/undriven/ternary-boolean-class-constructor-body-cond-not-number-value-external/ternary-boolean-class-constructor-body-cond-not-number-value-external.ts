export class TernaryBooleanClassConstructorBodyCondNotNumberValueExternal {
    public constructor() {
        console.log(!Number(process.argv[2]) ? 'then' : 'else');
    }
}
