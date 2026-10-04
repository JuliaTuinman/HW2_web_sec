import './globals.css'

export const metadata = {
  title: 'Pretty Chatbot',
  description: 'A beautiful chatbot that echoes your messages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}