const avatarColorClasses = [
  "bg-rose-200 text-rose-900",
  "bg-sky-200 text-sky-900",
  "bg-lime-200 text-lime-900",
  "bg-violet-200 text-violet-900",
  "bg-amber-200 text-amber-900",
  "bg-teal-200 text-teal-900",
  "bg-pink-200 text-pink-900",
  "bg-blue-200 text-blue-900",
]

export function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColorClasses[Math.abs(hash) % avatarColorClasses.length]
}
