const receiver: string = 'abc';

export function* ifNumberGeneratorFunctionCondStringLengthReceiverConst(): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
