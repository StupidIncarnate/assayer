const value: string = 'abc';

export class IfBooleanClassConstructorBodyCondGtStringValueConst {
    public constructor() {
        if (value > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
