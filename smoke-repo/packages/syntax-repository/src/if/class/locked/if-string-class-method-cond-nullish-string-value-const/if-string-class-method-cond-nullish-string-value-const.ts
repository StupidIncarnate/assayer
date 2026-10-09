const value: string | undefined = 'abc';

export class IfStringClassMethodCondNullishStringValueConst {
    public run(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
