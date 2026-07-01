import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { AlertTriangle, CheckCircle, Upload, X } from "lucide-react"

interface ImportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
  headers: string[]
  validationRules?: (row: any, index: number) => string[]
  onConfirm: (validData: any[]) => Promise<void>
  title?: string
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  data,
  headers,
  validationRules,
  onConfirm,
  title = "Import Data Preview",
}: ImportPreviewModalProps) {
  const [validatedRows, setValidatedRows] = useState<{ row: any; errors: string[]; index: number }[]>([])
  const [importing, setImporting] = useState(false)
  const [filterValidOnly, setFilterValidOnly] = useState(false)

  useEffect(() => {
    if (isOpen && data.length > 0) {
      const rows = data.map((row, index) => {
        const errors = validationRules ? validationRules(row, index) : []
        return { row, errors, index: index + 1 }
      })
      setValidatedRows(rows)
    }
  }, [isOpen, data, validationRules])

  const totalErrors = validatedRows.reduce((sum, r) => sum + r.errors.length, 0)
  const rowsWithErrorsCount = validatedRows.filter(r => r.errors.length > 0).length
  const validRows = validatedRows.filter(r => r.errors.length === 0).map(r => r.row)
  
  const handleConfirm = async () => {
    try {
      setImporting(true)
      const dataToImport = filterValidOnly ? validRows : validatedRows.map(r => r.row)
      await onConfirm(dataToImport)
      onClose()
    } catch (err) {
      console.error("Failed to import:", err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Review and validate records parsed from your uploaded spreadsheet file before importing.
          </DialogDescription>
        </DialogHeader>

        {/* Validation Summary Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Total Parsed Records</span>
            <span className="text-xl font-bold">{data.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Records with Issues</span>
            <span className="text-xl font-bold flex items-center gap-1.5">
              {rowsWithErrorsCount > 0 ? (
                <>
                  <span className="text-destructive">{rowsWithErrorsCount}</span>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </>
              ) : (
                <>
                  <span className="text-green-600">0</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Valid Records</span>
            <span className="text-xl font-bold text-green-600">{validRows.length}</span>
          </div>
        </div>

        {totalErrors > 0 && (
          <div className="p-3 mb-4 rounded bg-destructive/10 text-destructive text-[11px] flex flex-col gap-1 border border-destructive/20">
            <div className="font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Found {totalErrors} validation errors across {rowsWithErrorsCount} records.
            </div>
            <p>Please fix errors in your file or toggle "Skip rows with errors" below to import only valid records.</p>
          </div>
        )}

        {/* Filters and actions */}
        {rowsWithErrorsCount > 0 && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={filterValidOnly}
                onChange={(e) => setFilterValidOnly(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-700"
              />
              Skip rows with errors (will import only {validRows.length} valid rows)
            </label>
          </div>
        )}

        {/* Scrollable Preview Table */}
        <div className="flex-1 overflow-hidden border rounded-md min-h-[250px] flex flex-col bg-card">
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-[10px]">Row</TableHead>
                  <TableHead className="w-24 text-[10px]">Status</TableHead>
                  {headers.map((h, i) => (
                    <TableHead key={i} className="text-[10px] uppercase font-semibold">{h}</TableHead>
                  ))}
                  {rowsWithErrorsCount > 0 && (
                    <TableHead className="text-[10px] text-destructive uppercase font-semibold">Errors</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {validatedRows
                  .filter(r => !filterValidOnly || r.errors.length === 0)
                  .map((item) => (
                    <TableRow key={item.index} className={item.errors.length > 0 ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
                      <TableCell className="text-[10px] font-medium text-muted-foreground">{item.index}</TableCell>
                      <TableCell>
                        {item.errors.length > 0 ? (
                          <Badge variant="destructive" className="text-[9px] h-4 py-0 uppercase">Error</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] h-4 py-0 uppercase bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">Valid</Badge>
                        )}
                      </TableCell>
                      {headers.map((h, i) => {
                        const cellVal = item.row[h] ?? "";
                        return (
                          <TableCell key={i} className="text-[11px] truncate max-w-[150px]">
                            {typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal)}
                          </TableCell>
                        )
                      })}
                      {rowsWithErrorsCount > 0 && (
                        <TableCell className="text-[10px] text-destructive font-medium max-w-[200px]">
                          {item.errors.length > 0 ? (
                            <ul className="list-disc pl-3 space-y-0.5">
                              {item.errors.map((err, errIdx) => <li key={errIdx}>{err}</li>)}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4 gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={importing || (totalErrors > 0 && !filterValidOnly) || (filterValidOnly && validRows.length === 0)}
          >
            {importing ? "Importing..." : `Confirm Import (${filterValidOnly ? validRows.length : data.length} Rows)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
