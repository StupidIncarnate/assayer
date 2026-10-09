const cond: string = 'abc';

export class IfStringClassConstructorBodyCondConst {
    public constructor() {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
