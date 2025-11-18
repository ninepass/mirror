export const metadata = {
  title: '学术镜像',
  description: 'Google Scholar Mirror'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
