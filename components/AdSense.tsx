import { useEffect } from 'react';

export default function AdSense() {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.error('AdSense error', e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', textAlign: 'center', margin: '1rem 0' }}
      data-ad-client="ca-pub-5103032140213770"
      data-ad-slot="1100099846"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
