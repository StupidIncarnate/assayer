if (process.env.MODE === 'production') {
  console.log('prod');
} else {
  console.log('dev');
}

const code = Number(process.env.CODE);

switch (code) {
  case 1:
    console.log('one');
    break;
  case 2:
    console.log('two');
    break;
  default:
    console.log('other');
}
