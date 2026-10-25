import './globals.css';

export const metadata = {
  title: 'Deco Turco | Alfombras',
  description: 'Alfombras de diseño para living rooms',
  icons: {
    icon: 'https://cdn.phototourl.com/member/2026-10-25-4c1434c5-4562-424d-a3f5-c67dad82a2b5.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
