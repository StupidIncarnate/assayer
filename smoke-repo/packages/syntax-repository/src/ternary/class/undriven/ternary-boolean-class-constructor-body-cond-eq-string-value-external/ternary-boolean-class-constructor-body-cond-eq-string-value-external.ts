export class TernaryBooleanClassConstructorBodyCondEqStringValueExternal {
    public constructor() {
        console.log((process.argv[2] ?? '') === 'xyz' ? 'then' : 'else');
    }
}
