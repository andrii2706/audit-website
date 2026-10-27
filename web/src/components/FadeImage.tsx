'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * next/image that fades in once decoded. Put it inside a container with the `skeleton` class:
 * the shimmer shows until the photo arrives. Hidden state applies only under `html.js`
 * (globals.css), so without JavaScript the image is always visible.
 */
export default function FadeImage({ onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      data-fade=""
      data-loaded={loaded ? '' : undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
