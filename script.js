const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/pages/Production.tsx', 'utf8');

content = content.replace(
  'import { Factory, TrendingUp, Target, Activity, Upload, Download, Plus, Edit, Trash2, Eye, RefreshCw, FileSpreadsheet } from "lucide-react"',
  'import { Factory, TrendingUp, Target, Activity, Upload, Download, Plus, Edit, Trash2, Eye, RefreshCw, FileSpreadsheet, Settings2 } from "lucide-react"'
);

content = content.replace(
  'import { fetchProductions, createProduction, fetchSites, fetchRmcGrades, deleteRecord, updateRecord } from "../services/api"',
  'import { fetchProductions, createProduction, fetchSites, fetchRmcGrades, deleteRecord, updateRecord, fetchCustomColumns } from "../services/api"'
);

content = content.replace(
  'import { ImportPreviewModal } from "../components/ImportPreviewModal"',
  'import { ImportPreviewModal } from "../components/ImportPreviewModal"\nimport { ManageColumnsModal } from "../components/ManageColumnsModal"'
);

content = content.replace(
  '  const [isImportOpen, setIsImportOpen] = useState(false)',
  '  const [isImportOpen, setIsImportOpen] = useState(false)\n  const [customCols, setCustomCols] = useState<any[]>([])\n  const [isManageColsOpen, setIsManageColsOpen] = useState(false)'
);

content = content.replace(
  '    rejectionReason: ""\n  })',
  '    rejectionReason: "",\n    customData: {} as Record<string, any>\n  })'
);

content = content.replace(
  '        fetchRmcGrades()',
  '        fetchRmcGrades(),\n        fetchCustomColumns("Production")'
);

content = content.replace(
  '      setRmcGrades(Array.isArray(gradeData) ? gradeData : [])',
  '      setRmcGrades(Array.isArray(gradeData) ? gradeData : [])\n      setCustomCols(Array.isArray(arguments[0][3]) ? arguments[0][3] : [])'
);

content = content.replace(
  '      const [prodData, siteData, gradeData] = await Promise.all([',
  '      const [prodData, siteData, gradeData, colsData] = await Promise.all(['
);

content = content.replace(
  '      setCustomCols(Array.isArray(arguments[0][3]) ? arguments[0][3] : [])',
  '      setCustomCols(Array.isArray(colsData) ? colsData : [])'
);

content = content.replace(
  '      await createProduction({\n        ...newProd,',
  '      await createProduction({\n        ...newProd,\n        customData: newProd.customData,'
);

content = content.replace(
  '      rejectionReason: item.rejectionReason || ""\n    })',
  '      rejectionReason: item.rejectionReason || "",\n      customData: item.customData || {}\n    })'
);

content = content.replace(
  '        rejectionReason: editingItem.rejectionReason\n      })',
  '        rejectionReason: editingItem.rejectionReason,\n        customData: editingItem.customData\n      })'
);

content = content.replace(
  '      ["date", "siteId", "amount", "unit", "grade", "productionType", "towerName", "notes", "isRejected", "rejectionReason"],',
  '      ["date", "siteId", "amount", "unit", "grade", "productionType", "towerName", "notes", "isRejected", "rejectionReason", ...customCols.map(c => c.key)],'
);

content = content.replace(
  '        rejectionReason: String(row.rejectionReason || "")\n      }))',
  '        rejectionReason: String(row.rejectionReason || ""),\n        customData: customCols.reduce((acc, col) => ({ ...acc, [col.key]: row[col.key] }), {})\n      }))'
);

content = content.replace(
  '      notes: p.notes || ""\n    }))',
  '      notes: p.notes || "",\n      ...(p.customData || {})\n    }))'
);

content = content.replace(
  '          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>',
  '          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={() => setIsManageColsOpen(true)}>\n            <Settings2 className="h-4 w-4 mr-2" />\n            Columns\n          </Button>\n          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>'
);

content = content.replace(
  '                  <TableHead>Grade</TableHead>\n                  <TableHead>Status</TableHead>',
  '                  <TableHead>Grade</TableHead>\n                  {customCols.map(c => (\n                    <TableHead key={c.id}>{c.name}</TableHead>\n                  ))}\n                  <TableHead>Status</TableHead>'
);

content = content.replace(
  '                    <TableCell className="text-xs font-medium">{item.grade || item.quality || "-"}</TableCell>\n                    <TableCell>',
  '                    <TableCell className="text-xs font-medium">{item.grade || item.quality || "-"}</TableCell>\n                    {customCols.map(c => (\n                      <TableCell key={c.id} className="text-xs">{item.customData?.[c.key] || "-"}</TableCell>\n                    ))}\n                    <TableCell>'
);

content = content.replace(
  '                  <div className="space-y-2 col-span-2">\n                    <Label htmlFor="notes">Notes / Remarks</Label>',
  '                  {customCols.map(c => (\n                    <div key={c.id} className="space-y-2">\n                      <Label>{c.name}</Label>\n                      <Input \n                        type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}\n                        value={newProd.customData[c.key] || ""}\n                        onChange={e => setNewProd({...newProd, customData: {...newProd.customData, [c.key]: e.target.value}})}\n                      />\n                    </div>\n                  ))}\n                  <div className="space-y-2 col-span-2">\n                    <Label htmlFor="notes">Notes / Remarks</Label>'
);

content = content.replace(
  '                <div className="space-y-2 col-span-2">\n                  <Label htmlFor="edit-notes">Notes / Remarks</Label>',
  '                {customCols.map(c => (\n                  <div key={c.id} className="space-y-2">\n                    <Label>{c.name}</Label>\n                    <Input \n                      type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}\n                      value={editingItem.customData[c.key] || ""}\n                      onChange={e => setEditingItem({...editingItem, customData: {...editingItem.customData, [c.key]: e.target.value}})}\n                    />\n                  </div>\n                ))}\n                <div className="space-y-2 col-span-2">\n                  <Label htmlFor="edit-notes">Notes / Remarks</Label>'
);

content = content.replace(
  '        title="Import Production Records"\n      />\n    </div>',
  '        title="Import Production Records"\n      />\n      <ManageColumnsModal \n        isOpen={isManageColsOpen}\n        onClose={() => setIsManageColsOpen(false)}\n        entityName="Production"\n        onColumnsChange={loadData}\n      />\n    </div>'
);

fs.writeFileSync('frontend/src/app/pages/Production.tsx', content);
