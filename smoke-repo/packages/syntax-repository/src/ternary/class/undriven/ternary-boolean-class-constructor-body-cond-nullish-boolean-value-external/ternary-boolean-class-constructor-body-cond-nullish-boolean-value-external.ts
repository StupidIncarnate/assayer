export class TernaryBooleanClassConstructorBodyCondNullishBooleanValueExternal {
    public constructor() {
        console.log((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else');
    }
}
