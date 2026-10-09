const value: string | undefined = 'abc';

export class TernaryStringClassGetterCondNullishStringValueConst {
    public get result(): string {
        return value ?? '' ? 'then' : 'else';
    }
}
