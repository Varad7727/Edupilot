import { describe, it, expect } from 'vitest';

describe('Assessment and Question Interaction Logic', () => {
  it('correctly handles single correct option selection', () => {
    let selectedOptions: string[] = [];

    // Selecting 'A'
    const select = (key: string, isSingle: boolean) => {
      if (isSingle) {
        selectedOptions = selectedOptions[0] === key ? [] : [key];
      }
    };

    select('A', true);
    expect(selectedOptions).toEqual(['A']);

    // Toggling 'A' off
    select('A', true);
    expect(selectedOptions).toEqual([]);

    // Selecting 'B'
    select('B', true);
    expect(selectedOptions).toEqual(['B']);
  });

  it('correctly handles multiple correct options selection', () => {
    let selectedOptions: string[] = [];

    const toggle = (key: string) => {
      selectedOptions = selectedOptions.includes(key)
        ? selectedOptions.filter((k) => k !== key)
        : [...selectedOptions, key];
    };

    toggle('A');
    toggle('C');
    expect(selectedOptions).toEqual(['A', 'C']);

    // Uncheck 'A'
    toggle('A');
    expect(selectedOptions).toEqual(['C']);
  });

  it('correctly checks numerical tolerance criteria', () => {
    const isNumericalCorrect = (actual: number, expected: number, tolerance: number) => {
      return Math.abs(actual - expected) <= tolerance;
    };

    expect(isNumericalCorrect(9.8, 9.81, 0.05)).toBe(true);
    expect(isNumericalCorrect(10.0, 9.81, 0.05)).toBe(false);
  });
});
