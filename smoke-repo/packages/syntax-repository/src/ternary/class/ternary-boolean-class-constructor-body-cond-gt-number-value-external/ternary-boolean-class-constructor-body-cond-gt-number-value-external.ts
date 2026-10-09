export class TernaryBooleanClassConstructorBodyCondGtNumberValueExternal {
    public constructor() {
        console.log(Number(process.argv[2]) > 5 ? 'then' : 'else');
    }
}
