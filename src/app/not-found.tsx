import Link from 'next/link';
import { Gavel } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Gavel className="w-12 h-12 text-brand-gray-700 mb-4" />
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-brand-gray-400 mb-6">找不到這個頁面</p>
      <Link href="/" className="btn-primary">返回首頁</Link>
    </div>
  );
}
