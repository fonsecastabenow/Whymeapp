import fs from 'fs'
import path from 'path'

export default function SitemapPage() {
  const svgPath = path.join(process.cwd(), 'public', 'sitemap-visual.svg')
  let svgContent = ''
  try {
    svgContent = fs.readFileSync(svgPath, 'utf-8')
  } catch {
    svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><text x="200" y="50" text-anchor="middle" fill="white">Mapa não disponível</text></svg>'
  }
  return (
    <div style={{ background: '#09090b', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  )
}
