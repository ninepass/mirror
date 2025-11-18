'use client'
import { useState } from 'react'

export default function Home() {
  const [site, setSite] = useState('scholar')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const sites = {
    scholar: 'https://scholar.google.com',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov',
    arxiv: 'https://arxiv.org'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const targetUrl = url || sites[site]
    setLoading(true)
    window.open(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, '_blank')
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>学术镜像代理</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>选择网站：</label>
          <select value={site} onChange={(e) => setSite(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
            <option value="scholar">Google Scholar</option>
            <option value="pubmed">PubMed</option>
            <option value="arxiv">arXiv</option>
          </select>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="或输入自定义 URL" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? '加载中...' : '访问'}
        </button>
      </form>
    </div>
  )
}
