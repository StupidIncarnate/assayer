export function* ternaryNumberGeneratorFunctionCondNullishNumberValueExternal(): Generator<string> {
    yield (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
}
