import { Node } from 'slate';

export interface LineNode {
  type: 'line';
  level: number;
  children: Node[];
}
