export function* ternaryNumberGeneratorFunctionCondExternal(): Generator<string> {
    yield Number(process.argv[2]) ? 'then' : 'else';
}
