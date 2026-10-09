const cond: string = 'abc';

export class TernaryStringClassConstructorBodyCondConst {
    public constructor() {
        console.log(cond ? 'then' : 'else');
    }
}
