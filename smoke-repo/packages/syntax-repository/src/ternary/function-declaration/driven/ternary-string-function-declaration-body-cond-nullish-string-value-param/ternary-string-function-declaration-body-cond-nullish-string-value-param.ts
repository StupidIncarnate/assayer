export function ternaryStringFunctionDeclarationBodyCondNullishStringValueParam(value: string | undefined): string {
    return value ?? '' ? 'then' : 'else';
}
