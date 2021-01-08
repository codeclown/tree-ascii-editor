import React, {
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
  Path,
  Point,
  Range,
  Transforms,
} from 'slate';
import { Slate, Editable, withReact, RenderElementProps } from 'slate-react';

interface LineNode {
  type: 'line';
  level: number;
  children: Node[];
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(100, level));
}

function withBackspace(editor: Editor): Editor {
  const { deleteBackward } = editor;
  editor.deleteBackward = (...args) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) && Element.isElement(n) && n.type === 'line',
      });
      if (match) {
        const [node, path] = match;
        const start = Editor.start(editor, path);
        if (Point.equals(selection.anchor, start)) {
          if (node.level === 1 && node.children[0].text.length === 0) {
            Transforms.removeNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                Element.isElement(n) &&
                n.type === 'line',
            });
          } else {
            Transforms.setNodes(
              editor,
              {
                level: clampLevel(node.level - 1),
              },
              {
                match: (n) =>
                  !Editor.isEditor(n) &&
                  Element.isElement(n) &&
                  n.type === 'line',
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
  const editor = useMemo(() => withBackspace(withReact(createEditor())), []);
  const [value, setValue] = useState<Node[]>([
    {
      type: 'line',
      level: 1,
      children: [{ text: 'project/' }],
    },
    {
      type: 'line',
      level: 2,
      children: [{ text: 'dist/' }],
    },
    {
      type: 'line',
      level: 3,
      children: [{ text: 'build.js' }],
    },
    {
      type: 'line',
      level: 2,
      children: [{ text: 'src/' }],
    },
    {
      type: 'line',
      level: 3,
      children: [{ text: 'client.js' }],
    },
    {
      type: 'line',
      level: 3,
      children: [{ text: 'example.js' }],
    },
    {
      type: 'line',
      level: 2,
      children: [{ text: 'package.json' }],
    },
  ]);
  const renderElement = useCallback(
    (props: RenderElementProps): ReactElement => {
      if (props.element.type !== 'line') {
        throw new Error(`Unknown element type: ${props.element.type}`);
      }

      return h(
        'div',
        {
          ...props.attributes,
          className: 'line',
        },
        h(
          'span',
          { contentEditable: false, className: 'tree-character' },
          '│   '.repeat(props.element.level - 1),
          '├── '
        ),
        h('span', null, props.children)
      );
    },
    []
  );
  return h(Slate, {
    editor: editor,
    value: value,
    onChange: (newValue) => setValue(newValue),
    children: h(Editable, {
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
        } else if (event.key === 'ArrowUp' && event.ctrlKey && event.metaKey) {
          // Transforms.moveNodes(editor, {
          //   at: editor.selection,
          //   match: (node) => Editor.isBlock(editor, node),
          //   to: Range.transform(editor.selection, {affinity: ""})
          // });
        }
      },
    }),
  });
}

render(h(App), document.querySelector('.app'));
