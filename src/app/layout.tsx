import type { Metadata, Viewport } from 'next';
import { ClientLayout } from '@/components/ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobLoop - AI求职助手',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window!=='undefined'){try{var o=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(!this||!this.isConnected)return{top:0,right:0,bottom:0,left:0,width:0,height:0,x:0,y:0,toJSON:function(){return{}}};return o.apply(this,arguments)};window.addEventListener('error',function(e){var m=e.message||'';if(m.indexOf('getBoundingClientRect')>-1){e.stopImmediatePropagation();return true}},true)}catch(e){}}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
