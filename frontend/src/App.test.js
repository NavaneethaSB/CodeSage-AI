import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <pre>{children}</pre>,
}));
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

test('renders the CodeSage coding workspace and all actions', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /write better code/i })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /code editor/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /explain/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /find bugs/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /optimize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /convert/i })).toBeInTheDocument();
});

test('indents Python blocks on Enter and supports Tab and Shift+Tab', () => {
  render(<App />);
  const editor = screen.getByRole('textbox', { name: /code editor/i });
  fireEvent.change(editor, { target: { value: 'if ready:' } });
  editor.setSelectionRange(9, 9);
  fireEvent.keyDown(editor, { key: 'Enter' });
  expect(editor).toHaveValue('if ready:\n  ');

  editor.setSelectionRange(editor.value.length, editor.value.length);
  fireEvent.keyDown(editor, { key: 'Tab' });
  expect(editor).toHaveValue('if ready:\n    ');
  editor.setSelectionRange(editor.value.length, editor.value.length);
  fireEvent.keyDown(editor, { key: 'Tab', shiftKey: true });
  expect(editor).toHaveValue('if ready:\n  ');
});
