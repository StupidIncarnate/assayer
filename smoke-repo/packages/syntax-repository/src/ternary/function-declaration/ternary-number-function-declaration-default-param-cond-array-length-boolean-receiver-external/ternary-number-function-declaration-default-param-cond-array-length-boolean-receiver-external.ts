export function ternaryNumberFunctionDeclarationDefaultParamCondArrayLengthBooleanReceiverExternal(label: string = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else'): string {
    return label;
}
