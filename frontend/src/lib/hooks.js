import { useEffect, useState } from 'react'

export function useSlowHint(loading, ms = 4000) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!loading) { setSlow(false); return undefined }
    const t = setTimeout(() => setSlow(true), ms)
    return () => clearTimeout(t)
  }, [loading, ms])
  return slow
}

export function useAsync() {
  const [state, setState] = useState({ loading: false, error: '', result: null })
  async function run(fn) {
    setState({ loading: true, error: '', result: null })
    try {
      const result = await fn()
      setState({ loading: false, error: '', result })
      return result
    } catch (e) {
      setState({ loading: false, error: e.message || String(e), result: null })
      return null
    }
  }
  return [state, run]
}
