const value: string | undefined = 'abc';

export class IfStringClassStaticMethodCondNullishStringValueConst {
    public static run(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
