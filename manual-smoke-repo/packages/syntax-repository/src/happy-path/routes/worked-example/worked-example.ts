const removeFirstLastCharacter = (text: string): string => text.slice(1, -1);

const setModelTitle = (title: string): string => title;
const setModelSubHeader = (subHeader: string): string => subHeader;
const setModelTitleSubHeader = (titleSubHeader: string): string => titleSubHeader;

export const someFn = (dataOuter: string): void => {
  let data = dataOuter.length < 5 ? dataOuter : 'NoneTon';
  if (data === 'None') data = removeFirstLastCharacter(data);
  if (data === 'No') {
    setModelTitle('Dont');
    setModelSubHeader('Nill');
  }
  if (data.includes('on')) setModelTitle('On Time');
  setModelTitleSubHeader('Off');
};
