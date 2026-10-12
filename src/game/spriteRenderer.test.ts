import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SpriteRenderer } from './spriteRenderer';

test('the default ninja uses the dedicated transparent character sprite', () => {
  const originalImage = (globalThis as { Image?: unknown }).Image;
  const spriteRendererInternals = SpriteRenderer as unknown as {
    ninjaSpriteImage: HTMLImageElement | null;
  };
  const previousSprite = spriteRendererInternals.ninjaSpriteImage;
  const drawnImages: unknown[][] = [];

  class MockImage {
    complete = true;
    naturalWidth = 768;
    naturalHeight = 493;
    src = '';
  }

  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: MockImage,
  });
  spriteRendererInternals.ninjaSpriteImage = null;

  const context = new Proxy(
    {
      drawImage: (...args: unknown[]) => drawnImages.push(args),
    },
    {
      get(target, key) {
        if (key in target) return target[key as keyof typeof target];
        return () => undefined;
      },
      set(target, key, value) {
        Reflect.set(target, key, value);
        return true;
      },
    }
  ) as unknown as CanvasRenderingContext2D;

  try {
    SpriteRenderer.drawSprite(
      context,
      180,
      360,
      'idle',
      'right',
      'ninja',
      0.5,
      false,
      1,
      'katana',
      'starter_scarf'
    );

    assert.equal(drawnImages.length, 1);
    const image = spriteRendererInternals.ninjaSpriteImage as unknown as MockImage;
    assert.match(image.src, /neon-ninja-sprite\.png/);
    assert.ok(image.naturalWidth > 0);
  } finally {
    spriteRendererInternals.ninjaSpriteImage = previousSprite;
    if (originalImage === undefined) {
      Reflect.deleteProperty(globalThis, 'Image');
    } else {
      Object.defineProperty(globalThis, 'Image', {
        configurable: true,
        value: originalImage,
      });
    }
  }
});
