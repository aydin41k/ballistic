import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/logo.png" alt="Ballistic" className={`rounded-lg shadow-sm ring-1 ring-white/10 ${className ?? ''}`} {...props} />;
}
