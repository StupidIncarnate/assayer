export const ifStringObjectLiteralMethodCondNullishStringValueParam = {
    run(value: string | undefined): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
