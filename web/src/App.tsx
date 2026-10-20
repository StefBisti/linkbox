import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Link = { id: number; url: string; title: string | null }

async function fetchLinks(): Promise<Link[]> {
  const res = await fetch('/api/links')
  return res.ok ? res.json() : []
}

export default function App() {
  const [links, setLinks] = useState<Link[]>([])
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLinks().then(setLinks)
  }, [])

  // The worker fills in titles in the background: after adding a link, poll for
  // up to 15 s while titles are missing (a failed fetch would leave one null forever).
  const [polling, setPolling] = useState(false)
  const pending = links.some((l) => l.title === null)
  useEffect(() => {
    if (!polling || !pending) return
    const timer = setInterval(() => fetchLinks().then(setLinks), 1000)
    const stop = setTimeout(() => setPolling(false), 15_000)
    return () => {
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [polling, pending])

  async function addLink(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) {
      setError(
        res.status === 400
          ? 'Please enter a full URL, like https://example.com'
          : `Something went wrong on the server (${res.status}). Try again later.`,
      )
      return
    }
    setUrl('')
    setLinks(await fetchLinks())
    setPolling(true)
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Linkbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addLink} className="flex gap-2">
            <Input
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.id} className="rounded-md border p-3">
                <p className="font-medium">{link.title ?? 'No title yet'}</p>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground break-all hover:underline">
                  {link.url}
                </a>
              </li>
            ))}
          </ul>
          {links.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
        </CardContent>
      </Card>
    </main>
  )
}
