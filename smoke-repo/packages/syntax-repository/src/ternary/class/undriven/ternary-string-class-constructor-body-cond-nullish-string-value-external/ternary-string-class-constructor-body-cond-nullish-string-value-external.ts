export class TernaryStringClassConstructorBodyCondNullishStringValueExternal {
    public constructor() {
        console.log((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else');
    }
}
