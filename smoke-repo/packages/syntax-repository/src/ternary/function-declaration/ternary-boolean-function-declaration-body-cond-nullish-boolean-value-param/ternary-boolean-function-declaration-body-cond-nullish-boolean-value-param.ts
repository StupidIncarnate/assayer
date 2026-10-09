export function ternaryBooleanFunctionDeclarationBodyCondNullishBooleanValueParam(value: boolean | undefined): string {
    return value ?? false ? 'then' : 'else';
}
