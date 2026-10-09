export class TernaryBooleanClassConstructorBodyCondGtStringValueExternal {
    public constructor() {
        console.log((process.argv[2] ?? '') > 'm' ? 'then' : 'else');
    }
}
