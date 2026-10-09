const value: string | undefined = 'abc';

export class TernaryStringClassMethodCondNullishStringValueConst {
    public run(): string {
        return value ?? '' ? 'then' : 'else';
    }
}
