const cond: number = 3;

export class IfNumberClassConstructorBodyCondConst {
    public constructor() {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
