export class IfStringClassMethodCondNullishStringValueParam {
    public run(value: string | undefined): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
