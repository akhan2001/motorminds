interface RepairOrderItem {
  id: string
  title: string
  vehicle: string
  date: string
  status: "todo" | "inProgress" | "done"
  statusColor: string
  description?: string
  customColor?: string
}

interface TransformedData {
  boardData: {
    todo: RepairOrderItem[]
    inProgress: RepairOrderItem[]
    done: RepairOrderItem[]
  }
  calendarData: { [date: string]: RepairOrderItem[] }
  listData: RepairOrderItem[]
}

export function transformData(data: any[]): TransformedData {
  const boardData = { todo: [], inProgress: [], done: [] }
  const calendarData: { [date: string]: RepairOrderItem[] } = {}
  const listData: RepairOrderItem[] = []

  if (!Array.isArray(data)) return { boardData, calendarData, listData }

  data.forEach((order) => {
    const details = order.repair_order_details?.[0]
    const status = mapStatus(order.status) // or use details?.status if your status is there
    const statusColor = getStatusColor(status)

    // Let's say we want to use details?.description as the 'title' or a separate 'description' field
    const titleFromDetails = details?.description || order.title || "Untitled"

    // Maybe we also have details?.colour that we want to store in `customColor`
    const customColor = details?.colour || ""

    // Build the vehicle display
    let vehicleString = "Unknown vehicle"
    const v = order.customers?.customer_vehicles?.[0]
    if (v) {
      vehicleString = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() || "Unknown vehicle"
    }

    const repairOrderItem: RepairOrderItem = {
      id: order.id,
      title: titleFromDetails,
      vehicle: vehicleString,
      date: order.created_at || new Date().toISOString(),
      status,
      statusColor,
      description: details?.description || "",
      customColor,
    }

    boardData[status].push(repairOrderItem)
    const dateKey = repairOrderItem.date.split("T")[0]
    if (!calendarData[dateKey]) calendarData[dateKey] = []
    calendarData[dateKey].push(repairOrderItem)
    listData.push(repairOrderItem)
  })

  return { boardData, calendarData, listData }
}

function mapStatus(s: string): "todo" | "inProgress" | "done" {
  if (!s) return "todo"
  switch (s.toLowerCase()) {
    case "pending":
      return "todo"
    case "in progress":
      return "inProgress"
    case "completed":
      return "done"
    default:
      return "todo"
  }
}

function getStatusColor(s: string): string {
  switch (s.toLowerCase()) {
    case "pending":
    case "todo":
      return "#e23232"
    case "in progress":
    case "inprogress":
      return "#d6cd24"
    case "completed":
    case "done":
      return "#1eb386"
    default:
      return "#e23232"
  }
}
