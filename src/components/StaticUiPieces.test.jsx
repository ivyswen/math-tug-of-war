import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  GameAudio,
  GameFooter,
  GameHeader,
  HomeButton,
  LanguageSelector,
  ViewControls,
} from './StaticUiPieces';

describe('StaticUiPieces', () => {
  it('renders the home button and game header as React components', () => {
    render(
      <>
        <HomeButton />
        <GameHeader />
      </>,
    );

    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /ARQON TORTISH: MATEMATIKA/i }),
    ).toBeInTheDocument();
  });

  it('renders the language selector options and view controls', () => {
    render(
      <>
        <LanguageSelector />
        <ViewControls />
      </>,
    );

    expect(screen.getByRole('option', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /中文/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute audio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument();
  });

  it('renders the audio element and footer links', () => {
    render(
      <>
        <GameAudio />
        <GameFooter />
      </>,
    );

    expect(document.getElementById('backgroundMusic')).not.toBeNull();
    expect(screen.getByRole('link', { name: /telegram/i })).toHaveAttribute(
      'href',
      'https://t.me/UZPRODEVS',
    );
    expect(screen.getByRole('link', { name: /xiaohongshu/i })).toHaveAttribute(
      'href',
      'https://www.xiaohongshu.com/user/profile/603f8925000000000100bda5',
    );
  });
});
