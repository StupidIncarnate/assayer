export class IfNumberClassConstructorBodyCondNullishNumberValueExternal {
    public constructor() {
        if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
