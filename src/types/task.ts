export type Task = {
  id: string
  date: string
  title: string
  vehicle: string
  status: "red" | "yellow" | "green"
  column: "todo" | "inProgress" | "done"
  assignee?: string
  difficulty?: string
  comments?: string
}

