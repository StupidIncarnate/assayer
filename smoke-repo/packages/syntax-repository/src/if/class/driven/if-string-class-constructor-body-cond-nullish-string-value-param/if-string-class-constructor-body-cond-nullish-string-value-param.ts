export class IfStringClassConstructorBodyCondNullishStringValueParam {
    public constructor(value: string | undefined) {
        if (value ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
