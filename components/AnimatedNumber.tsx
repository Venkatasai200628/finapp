import { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

type Props = {
  value: number;
  prefix?: string;
  duration?: number;
  style?: TextStyle | TextStyle[];
  formatter?: (n: number) => string;
};

function defaultFormat(n: number) {
  return Math.round(n).toLocaleString('en-IN');
}

export default function AnimatedNumber({ value, prefix = '', duration = 900, style, formatter = defaultFormat }: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf: number;

    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}
      {formatter(display)}
    </Text>
  );
}
