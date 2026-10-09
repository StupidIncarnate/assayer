export class IfStringClassStaticMethodCondNullishStringValueParam {
    public static run(value: string | undefined): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
