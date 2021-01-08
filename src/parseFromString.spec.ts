import parseFromString from './parseFromString';

describe('parseFromString', () => {
  it('parses nothing', () => {
    expect(parseFromString('')).toEqual([]);
    expect(parseFromString('\n')).toEqual([]);
    expect(parseFromString(' ')).toEqual([]);
    expect(parseFromString('  ')).toEqual([]);
  });

  it('parses unix tree output', () => {
    expect(
      parseFromString(
        `
path/to/folder/
├── a-first.html
├── b-second.html
├── subfolder
│   ├── readme.html
│   ├── code.cpp
│   ├── sub
│   │   └── file.html
│   └── code.h
└── z-last-file.html
        `.trim()
      )
    ).toMatchSnapshot();

    expect(
      parseFromString(
        `
path/to/folder/
└── subfolder
    └── sub
        └── file.html
        `.trim()
      )
    ).toMatchSnapshot();
  });

  it('parses mac tree output', () => {
    expect(
      parseFromString(
        `
path/to/folder/
|-- a-first.html
|-- b-second.html
|-- subfolder
|   |-- readme.html
|   |-- code.cpp
|   |-- sub
|   |   \`-- file.html
|   \`-- code.h
\`-- z-last-file.html
        `.trim()
      )
    ).toMatchSnapshot();

    expect(
      parseFromString(
        `
path/to/folder/
\`-- subfolder
    \`-- sub
        \`-- file.html
        `.trim()
      )
    ).toMatchSnapshot();
  });
});
