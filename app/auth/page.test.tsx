import { render, screen } from '@testing-library/react';
import AuthPage from './page';

test('renders authentication page', () => {
	render(<AuthPage />);
	const linkElement = screen.getByText(/login/i);
	expect(linkElement).toBeInTheDocument();
});