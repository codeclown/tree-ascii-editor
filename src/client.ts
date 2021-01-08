import {
  createElement as h,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { render } from 'react-dom';
import {
  createEditor,
  Editor,
  Element,
  Node,
  Point,
  Range,
  Transforms,
} from 'slate';
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  ReactEditor,
} from 'slate-react';
import parseFromString from './parseFromString';
import { LineNode } from './types';

function clampLevel(level: number): number {
  return Math.max(0, Math.min(100, level));
}

function withPaste(editor: ReactEditor): ReactEditor {
  const { insertData } = editor;
  editor.insertData = (data) => {
    const text = data.getData('text/plain');
    const parsed = parseFromString(text);
    Transforms.insertFragment(editor, parsed);
  };
  return editor;
}

function withBackspace(editor: ReactEditor): ReactEditor {
  const { deleteBackward } = editor;
  editor.deleteBackward = (...args) => {
    const { selection } = editor;
    if (
      selection &&
      Range.isCollapsed(selection) &&
      editor.children.length > 1
    ) {
      const [match] = Editor.nodes(editor, {
        match: (n) => !Editor.isEditor(n) && n.type === 'line',
      });
      if (match) {
        const [node, path] = match;
        const start = Editor.start(editor, path);
        if (Point.equals(selection.anchor, start)) {
          if (node.level === 0 && node.children[0].text.length === 0) {
            Transforms.removeNodes(editor, {
              match: (n) => !Editor.isEditor(n) && n.type === 'line',
            });
          } else {
            Transforms.setNodes(
              editor,
              {
                level: clampLevel(node.level - 1),
              },
              {
                match: (n) => !Editor.isEditor(n) && n.type === 'line',
              }
            );
          }
          return;
        }
      }
    }
    deleteBackward(...args);
  };
  return editor;
}

function App() {
  const editor = useMemo(
    () => withPaste(withBackspace(withReact(createEditor()))),
    []
  );
  const [value, setValue] = useState<LineNode[]>(
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
  );
  const renderElement = useCallback(
    (props: RenderElementProps): ReactElement => {
      if (props.element.type !== 'line') {
        throw new Error(`Unknown element type: ${props.element.type}`);
      }

      return h(
        'div',
        {
          ...props.attributes,
          className: 'd-flex px-2',
        },
        h(
          'span',
          { contentEditable: false, className: 'text-black-50' },
          props.element.level > 1 ? '│   '.repeat(props.element.level - 1) : '',
          props.element.level > 0 ? '├── ' : ''
        ),
        h('span', null, props.children)
      );
    },
    []
  );
  return h(
    'div',
    {
      className: 'container-fluid p-4 font-monospace',
      style: {
        fontSize: '0.8rem',
      },
    },
    h('p', null, 'tree ascii editor'),
    h(
      'div',
      { className: 'bg-light border-start border-3 py-2 my-3' },
      h(Slate, {
        editor,
        value: value,
        onChange: (newValue) => setValue(newValue),
        children: h(Editable, {
          placeholder: 'Paste tree output here…',
          autoFocus: true,
          renderElement,
          onKeyDown: (event) => {
            if (event.key === 'Tab') {
              event.preventDefault();
              const increment = event.shiftKey ? -1 : 1;
              const nodes = Editor.nodes<LineNode>(editor, {
                at: editor.selection,
                match: (node) => Editor.isBlock(editor, node),
              });
              for (const [node, path] of nodes) {
                Transforms.setNodes(
                  editor,
                  { level: clampLevel(node.level + increment) },
                  { at: path }
                );
              }
            } else if (
              event.key === 'ArrowUp' &&
              event.ctrlKey &&
              event.metaKey
            ) {
              // Transforms.moveNodes(editor, {
              //   at: editor.selection,
              //   match: (node) => Editor.isBlock(editor, node),
              //   to: Range.transform(editor.selection, {affinity: ""})
              // });
            }
          },
        }),
      })
    ),
    h('p', null, h('kbd', null, 'tab'), ' indent all lines in selection'),
    h(
      'p',
      null,
      h('kbd', null, 'shift'),
      ' ',
      h('kbd', null, 'tab'),
      ' deindent all lines in selection'
    )
  );
}

render(h(App), document.querySelector('.app'));
