import { ReactNode } from 'react';
import Header from '../common/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>{children}</main>
    </div>
  );
} 