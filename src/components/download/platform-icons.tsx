// 平台品牌标志（lucide 不含品牌图标）
type IconProps = { className?: string };

export function AppleMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.88-1.28 1.24-2.52 1.26-2.59-.03-.01-2.4-.92-2.41-3.68ZM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28Z" />
    </svg>
  );
}

export function WindowsMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M3 5.1 10.4 4v7.2H3V5.1Zm8.4-1.24L21 2.5v8.7h-9.6V3.86ZM3 12.8h7.4V20L3 18.9v-6.1Zm8.4 0H21v8.7l-9.6-1.36V12.8Z" />
    </svg>
  );
}

export function AndroidMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.52 9.47 19.3 6.4a.37.37 0 0 0-.64-.37l-1.8 3.12A11.1 11.1 0 0 0 12 8.13c-1.75 0-3.4.37-4.86 1.02l-1.8-3.12a.37.37 0 1 0-.64.37l1.78 3.07C3.42 11.12 1.32 14.2 1 17.8h22c-.32-3.6-2.42-6.68-5.48-8.33ZM7 15.05a.92.92 0 1 1 0-1.84.92.92 0 0 1 0 1.84Zm10 0a.92.92 0 1 1 0-1.84.92.92 0 0 1 0 1.84Z" />
    </svg>
  );
}
