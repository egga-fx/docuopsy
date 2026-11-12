import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const styles = readFileSync('src/index.css', 'utf8');

describe('Frontend Dual-Engine Smoke Test', () => {
  it('should verify test runner environment is active', () => {
    expect(true).toBe(true);
  });

  it.each(['input', 'textarea', 'select'])('uses one inset focus indicator for %s', (tag) => {
    const style = document.createElement('style');
    style.textContent = styles.replace(/@tailwind\s+\w+;/g, '');
    document.head.append(style);
    const field = document.createElement(tag);
    document.body.append(field);
    try {
      field.focus();
      const focused = getComputedStyle(field);
      expect(focused.outline).toBe('2px solid var(--app-accent)');
      expect(focused.outlineOffset).toBe('-2px');
      expect(focused.boxShadow).toBe('none');
    } finally {
      field.remove();
      style.remove();
    }
  });

  it.each(['input', 'textarea', 'select', 'button'])('preserves the normal %s radius on focus and blur', (tag) => {
    const style = document.createElement('style');
    style.textContent = `.test-control { border-radius: 8px; }\n${styles.replace(/@tailwind\s+\w+;/g, '')}`;
    document.head.append(style);
    const control = document.createElement(tag);
    control.className = 'test-control';
    document.body.append(control);
    try {
      expect(getComputedStyle(control).borderRadius).toBe('8px');
      control.focus();
      // Invalidate jsdom's style cache after focus changes pseudo-class matching.
      control.setAttribute('data-focus-check', 'true');
      expect(getComputedStyle(control).borderRadius).toBe('8px');
      control.blur();
      control.removeAttribute('data-focus-check');
      expect(getComputedStyle(control).borderRadius).toBe('8px');
    } finally {
      control.remove();
      style.remove();
    }
  });

  it('retains the external keyboard-focus outline for buttons', () => {
    const style = document.createElement('style');
    style.textContent = styles.replace(/@tailwind\s+\w+;/g, '');
    document.head.append(style);
    const button = document.createElement('button');
    document.body.append(button);
    try {
      button.focus();
      expect(getComputedStyle(button).outlineOffset).toBe('2px');
    } finally {
      button.remove();
      style.remove();
    }
  });
});

