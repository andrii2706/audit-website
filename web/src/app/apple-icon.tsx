import { ImageResponse } from 'next/og';
import BrandMark from '@/components/BrandMark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ display: 'flex', width: 120, height: 136 }}>
          <BrandMark />
        </div>
      </div>
    ),
    size,
  );
}
