const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
