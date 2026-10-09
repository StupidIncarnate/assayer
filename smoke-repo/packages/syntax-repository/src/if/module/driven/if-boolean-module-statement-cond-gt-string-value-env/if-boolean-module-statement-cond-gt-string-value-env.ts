const value = process.env.VALUE ?? '';

if (value > 'm') {
    console.log('then');
}

console.log('else');

export {};
