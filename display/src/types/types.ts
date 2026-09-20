export type Substitution = { hour: string; class: string; teacher: string; room: string }

export type BoardData = {
  title?: string
  substitutions?: Substitution[]
  announcements?: string[]
  gallery?: string[]
}
