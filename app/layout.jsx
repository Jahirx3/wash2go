import './globals.css'

export const metadata = {
  title: 'Wash2Go — Lo Pides, Llegamos',
  description: 'Sistema de gestión de autolavado a domicilio — Comayagua, Honduras',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
