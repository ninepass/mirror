'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function ProxyContent() {
  const searchParams = useSearchParams()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const url = searchParams.get('url')
    if (!url) return

    fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
      .then(res => res.text())
      .then(html => setContent(html))
      .catch(err => setError(err.message))
  }, [searchParams])

  if (error) return <div style={{ padding: '20px', color: 'red' }}>错误: {error}</div>
  if (!content) return <div style={{ padding: '20px' }}>加载中...</div>

  return <div dangerouslySetInnerHTML={{ __html: content }} />
}

export default function ProxyPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>加载中...</div>}>
      <ProxyContent />
    </Suspense>
  )
}
