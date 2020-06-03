import * as babel from 'babel-core';

// const babelOptions = {
//   presets: ['react', ['es2015', { modules: false }]],
// };

export default function preprocess(str: any) {
  const { code } = babel.transform(str);
  console.log(code);
  return code;
}
