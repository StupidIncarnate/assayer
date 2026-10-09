const receiver: readonly boolean[] = [true, false, true];

export function* ternaryNumberGeneratorFunctionCondArrayLengthBooleanReceiverConst(): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
