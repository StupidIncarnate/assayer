export function ifStringFunctionDeclarationBodyCondParam(cond: string): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
