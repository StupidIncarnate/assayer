export class TernaryStringClassConstructorBodyCondExternal {
    public constructor() {
        console.log(process.argv[2] ?? '' ? 'then' : 'else');
    }
}
