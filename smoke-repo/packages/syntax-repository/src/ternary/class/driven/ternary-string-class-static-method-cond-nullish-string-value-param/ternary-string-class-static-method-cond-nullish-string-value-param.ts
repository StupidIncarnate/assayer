export class TernaryStringClassStaticMethodCondNullishStringValueParam {
    public static run(value: string | undefined): string {
        return value ?? '' ? 'then' : 'else';
    }
}
