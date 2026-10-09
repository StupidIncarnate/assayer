const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
