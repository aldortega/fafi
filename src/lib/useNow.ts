import { useEffect, useState } from "react"

function formatNow() {
  return new Date().toLocaleString("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function useNow() {
  const [now, setNow] = useState(() => formatNow())
  useEffect(() => {
    const timer = setInterval(() => setNow(formatNow()), 60000)
    return () => clearInterval(timer)
  }, [])
  return now
}
