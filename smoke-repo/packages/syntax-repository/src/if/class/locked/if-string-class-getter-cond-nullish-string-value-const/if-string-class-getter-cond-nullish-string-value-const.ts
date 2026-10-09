const value: string | undefined = 'abc';

export class IfStringClassGetterCondNullishStringValueConst {
    public get result(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
