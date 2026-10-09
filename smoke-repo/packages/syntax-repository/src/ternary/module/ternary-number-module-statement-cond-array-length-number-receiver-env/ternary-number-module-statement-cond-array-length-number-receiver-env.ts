const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

console.log(receiver.length ? 'then' : 'else');

export {};
