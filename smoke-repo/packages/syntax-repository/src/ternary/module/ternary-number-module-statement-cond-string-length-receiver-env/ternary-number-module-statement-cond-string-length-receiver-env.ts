const receiver = process.env.RECEIVER ?? '';

console.log(receiver.length ? 'then' : 'else');

export {};
