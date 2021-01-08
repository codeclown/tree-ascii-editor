import { LineNode } from './types';

const unixStyle = /^(   |│   |├── |└── )+/;
const macStyle = /^(   |\|   |\|-- |`-- )+/;

export default function parseFromString(text: string): LineNode[] {
  const lines = text.split(/\n+/g).filter((line) => !line.match(/^\s*$/));
  return lines.map((line) => {
    const segments = line.match(unixStyle) || line.match(macStyle);
    const level = segments ? Math.ceil(segments[0].length / 4) : 0;
    const text = line.slice(level * 4);
    return {
      type: 'line',
      level,
      children: [{ text }],
    };
  });
}
