import "./globals.css";

export const metadata = {
  title: "DecodeX | Office Decoding Game",
  description: "Can you decode the truth? The ultimate office challenge.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="main-container">
          {children}
        </div>
      </body>
    </html>
  );
}
