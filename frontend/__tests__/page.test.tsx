import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home page', () => {
  it('renders Hello World heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Hello World');
  });

  it('renders welcome message', () => {
    render(<Home />);
    const welcome = screen.getByText(/Welcome to our Hello World website/i);
    expect(welcome).toBeInTheDocument();
  });

  it('renders main element', () => {
    render(<Home />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
