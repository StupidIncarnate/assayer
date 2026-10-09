const value: string | undefined = 'abc';

export class TernaryStringClassStaticMethodCondNullishStringValueConst {
    public static run(): string {
        return value ?? '' ? 'then' : 'else';
    }
}
