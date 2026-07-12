import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface CustomColumn {
  id: string
  name: string
  key: string
  type: string
}

interface CustomFieldInputsProps {
  columns: CustomColumn[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
}

/**
 * Renders form inputs for user-defined custom columns, bound to a `customData` object.
 * The input control is chosen from the column's declared type.
 */
export function CustomFieldInputs({ columns, values, onChange }: CustomFieldInputsProps) {
  if (!columns || columns.length === 0) return null

  return (
    <>
      {columns.map((col) => (
        <div key={col.id} className="space-y-1">
          <Label>{col.name}</Label>
          {col.type === "boolean" ? (
            <Select
              value={values?.[col.key] === true || values?.[col.key] === "true" ? "true" : "false"}
              onValueChange={(v) => onChange(col.key, v === "true")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
              value={values?.[col.key] ?? ""}
              onChange={(e) => onChange(col.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </>
  )
}
