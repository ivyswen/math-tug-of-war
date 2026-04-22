import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SetupModal } from './SetupModal';

describe('SetupModal', () => {
      it('renders the setup title, stepper, and primary navigation controls', () => {
    render(<SetupModal />);

    expect(
      screen.getByRole('heading', { name: /PREPARE YOUR TEAMS/i }),
    ).toBeInTheDocument();
    expect(document.getElementById('stepOperations')).toHaveTextContent('Operations');
    expect(document.getElementById('stepDifficulty')).toHaveTextContent('Difficulty');
    expect(document.getElementById('stepTeams')).toHaveTextContent('Teams');
    expect(screen.getByRole('button', { name: /BACK/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /NEXT/i })).toBeInTheDocument();
    expect(document.getElementById('startGameBtn')).not.toBeNull();
  });

  it('controls the setup flow in React state', () => {
    render(<SetupModal />);

    const addButton = document.querySelector('.operation-btn[data-op="+"]');
    const subtractButton = document.querySelector('.operation-btn[data-op="-"]');
    const nextButton = document.getElementById('setupNextBtn');
    const startButton = document.getElementById('startGameBtn');
    const backButton = document.getElementById('setupBackBtn');

    expect(addButton).toHaveClass('active');
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(addButton);
    expect(nextButton).toBeDisabled();
    expect(addButton).not.toHaveClass('active');

    fireEvent.click(subtractButton);
    expect(nextButton).not.toBeDisabled();
    expect(subtractButton).toHaveClass('active');

    fireEvent.click(nextButton);
    expect(document.querySelector('.setup-step[data-step="1"]')).toHaveClass('active');
    expect(backButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(document.querySelector('.setup-step[data-step="2"]')).toHaveClass('active');
    expect(nextButton).toHaveStyle({ display: 'none' });
    expect(startButton).toHaveStyle({ display: 'inline-flex' });
  });

  it('updates difficulty selection and team input values with legacy ids', () => {
    render(<SetupModal />);

    const mediumButton = document.querySelector('.difficulty-btn[data-level="medium"]');
    const hardButton = document.querySelector('.difficulty-btn[data-level="hard"]');
    const leftInput = document.getElementById('teamLeftName');
    const rightInput = document.getElementById('teamRightName');

    fireEvent.click(mediumButton);
    expect(mediumButton).toHaveClass('active');
    expect(hardButton).not.toHaveClass('active');

    fireEvent.change(leftInput, { target: { value: 'Blue Team' } });
    fireEvent.change(rightInput, { target: { value: 'Red Team' } });

    expect(leftInput).toHaveValue('Blue Team');
    expect(rightInput).toHaveValue('Red Team');
    expect(screen.getAllByPlaceholderText(/Team name/i)).toHaveLength(2);
    expect(document.getElementById('startScreen')).not.toBeNull();
    expect(document.getElementById('countdown')).not.toBeNull();
  });
});
