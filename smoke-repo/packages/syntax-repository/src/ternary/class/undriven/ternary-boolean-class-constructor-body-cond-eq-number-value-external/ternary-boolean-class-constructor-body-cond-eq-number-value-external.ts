export class TernaryBooleanClassConstructorBodyCondEqNumberValueExternal {
    public constructor() {
        console.log(Number(process.argv[2]) === 7 ? 'then' : 'else');
    }
}
