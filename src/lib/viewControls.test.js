import { describe, expect, it } from 'vitest';
import { calculateViewState } from './viewControls';

describe('calculateViewState', () => {
  it('limits zoom by board fit and applies game scale', () => {
    const result = calculateViewState({
      shellWidth: 1200,
      shellHeight: 700,
      paddingX: 40,
      paddingY: 20,
      boardWidth: 1000,
      boardHeight: 500,
      modalVisible: false,
      modalWidth: 0,
      modalHeight: 0,
      windowWidth: 1200,
      windowHeight: 700,
      zoomPercent: 100,
      minPercent: 60,
      maxPercent: 150,
    });

    expect(result.zoomMaxPercent).toBe(116);
    expect(result.zoomPercent).toBe(100);
    expect(result.gameScale).toBeCloseTo(1);
    expect(result.modalScale).toBeCloseTo(1);
  });

  it('limits zoom by visible modal size when the setup screen is open', () => {
    const result = calculateViewState({
      shellWidth: 1400,
      shellHeight: 900,
      paddingX: 40,
      paddingY: 20,
      boardWidth: 1000,
      boardHeight: 500,
      modalVisible: true,
      modalWidth: 800,
      modalHeight: 700,
      windowWidth: 1000,
      windowHeight: 800,
      zoomPercent: 150,
      minPercent: 60,
      maxPercent: 150,
    });

    expect(result.zoomMaxPercent).toBe(105);
    expect(result.zoomPercent).toBe(105);
    expect(result.gameScale).toBeCloseTo(1.05);
    expect(result.modalScale).toBeCloseTo(1.05);
  });
});
