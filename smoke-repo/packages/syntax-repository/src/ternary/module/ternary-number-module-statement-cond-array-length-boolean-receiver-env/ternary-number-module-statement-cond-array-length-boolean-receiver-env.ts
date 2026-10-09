const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

console.log(receiver.length ? 'then' : 'else');

export {};
