const receiver: readonly number[] = [10, 20, 30];

export function* ternaryNumberGeneratorFunctionCondArrayLengthNumberReceiverConst(): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
