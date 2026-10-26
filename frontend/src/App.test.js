import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

test('renders the CodeSage coding workspace and all actions', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /write better code/i })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /code editor/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /explain/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /find bugs/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /optimize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /convert/i })).toBeInTheDocument();
});
