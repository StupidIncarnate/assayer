const receiver: string = 'abc';

export function* ternaryNumberGeneratorFunctionCondStringLengthReceiverConst(): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
