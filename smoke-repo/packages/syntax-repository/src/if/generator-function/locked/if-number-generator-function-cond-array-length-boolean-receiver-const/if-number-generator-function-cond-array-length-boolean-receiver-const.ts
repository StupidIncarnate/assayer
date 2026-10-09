const receiver: readonly boolean[] = [true, false, true];

export function* ifNumberGeneratorFunctionCondArrayLengthBooleanReceiverConst(): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
