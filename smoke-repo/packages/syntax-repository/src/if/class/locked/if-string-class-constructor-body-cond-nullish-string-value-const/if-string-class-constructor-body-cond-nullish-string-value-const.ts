const value: string | undefined = 'abc';

export class IfStringClassConstructorBodyCondNullishStringValueConst {
    public constructor() {
        if (value ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
