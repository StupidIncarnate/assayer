export class TernaryBooleanClassConstructorBodyCondEqBooleanValueExternal {
    public constructor() {
        console.log(process.argv[2] === 'yes' === false ? 'then' : 'else');
    }
}
