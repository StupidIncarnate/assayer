const receiver = process.env.RECEIVER ?? '';

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
