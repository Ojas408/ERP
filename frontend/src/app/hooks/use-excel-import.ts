import { ChangeEvent, useState } from "react"
import { parseExcelFile } from "../lib/excel-helper"

type ExcelImportOptions = {
  onError?: (error: Error) => void
}

export function useExcelImport<T extends object = Record<string, unknown>>(
  { onError }: ExcelImportOptions = {},
) {
  const [importData, setImportData] = useState<T[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    try {
      const rows = await parseExcelFile(file)
      setImportData(rows as T[])
      setIsImportOpen(true)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Failed to parse excel file"))
    } finally {
      input.value = ""
    }
  }

  return {
    importData,
    isImportOpen,
    setIsImportOpen,
    handleExcelImport,
  }
}
