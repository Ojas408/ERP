const fs = require('fs');

function updateFile(filePath, entityName) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Imports
  if (!content.includes('Settings2')) {
    content = content.replace(/import {([^}]+)} from "lucide-react"/, 'import {$1, Settings2 } from "lucide-react"');
  }
  if (!content.includes('fetchCustomColumns')) {
    content = content.replace(/import {([^}]+)} from "\.\.\/services\/api"/, 'import {$1, fetchCustomColumns } from "../services/api"');
  }
  if (!content.includes('ManageColumnsModal')) {
    content = content.replace('import { ImportPreviewModal } from "../components/ImportPreviewModal"', 'import { ImportPreviewModal } from "../components/ImportPreviewModal"\nimport { ManageColumnsModal } from "../components/ManageColumnsModal"');
  }

  // 2. States
  if (!content.includes('const [customCols, setCustomCols]')) {
    content = content.replace(
      'const [isImportOpen, setIsImportOpen] = useState(false)',
      'const [isImportOpen, setIsImportOpen] = useState(false)\n  const [customCols, setCustomCols] = useState<any[]>([])\n  const [isManageColsOpen, setIsManageColsOpen] = useState(false)'
    );
  }

  // 3. new state customData
  content = content.replace(
    /rejectionReason: ""(\s*)\}\)/,
    'rejectionReason: "",\n    customData: {} as Record<string, any>$1})'
  );

  // 4. loadData
  if (content.includes('fetchConsumptions()')) {
    content = content.replace(
      /const \[consData, siteData\] = await Promise\.all\(\[\s*fetchConsumptions\(\),\s*fetchSites\(\)\s*\]\)/,
      `const [consData, siteData, colsData] = await Promise.all([\n        fetchConsumptions(),\n        fetchSites(),\n        fetchCustomColumns("${entityName}")\n      ])`
    );
    content = content.replace(
      /setSites\(Array\.isArray\(siteData\) \? siteData : \[\]\)/,
      `setSites(Array.isArray(siteData) ? siteData : [])\n      setCustomCols(Array.isArray(colsData) ? colsData : [])`
    );
  } else if (content.includes('fetchRmcGrades()')) {
    content = content.replace(
      /const \[gradeData\] = await Promise\.all\(\[\s*fetchRmcGrades\(\)\s*\]\)/,
      `const [gradeData, colsData] = await Promise.all([\n        fetchRmcGrades(),\n        fetchCustomColumns("${entityName}")\n      ])`
    );
    content = content.replace(
      /setGrades\(Array\.isArray\(gradeData\) \? gradeData : \[\]\)/,
      `setGrades(Array.isArray(gradeData) ? gradeData : [])\n      setCustomCols(Array.isArray(colsData) ? colsData : [])`
    );
  }

  // 5. handleEdit
  content = content.replace(
    /rejectionReason: item\.rejectionReason \|\| ""(\s*)\}\)/,
    'rejectionReason: item.rejectionReason || "",\n      customData: item.customData || {}$1})'
  );

  // 6. handleUpdate
  content = content.replace(
    /rejectionReason: editingItem\.rejectionReason(\s*)\}\)/,
    'rejectionReason: editingItem.rejectionReason,\n        customData: editingItem.customData$1})'
  );

  // 7. add/edit form (customData fields)
  // this is tricky via regex, we'll do it if it's easy or skip and add manually.
  // actually, let's inject before "Notes / Remarks" or before the last field in grid.

  // 8. Toolbar button
  if (!content.includes('Columns')) {
    content = content.replace(
      /<Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>/,
      `<Button variant="outline" className="text-xs h-9 border-slate-300" onClick={() => setIsManageColsOpen(true)}>\n            <Settings2 className="h-4 w-4 mr-2" />\n            Columns\n          </Button>\n          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>`
    );
  }

  // 9. Table headers
  content = content.replace(
    /<TableHead>Status<\/TableHead>/,
    `{customCols.map(c => (\n                    <TableHead key={c.id}>{c.name}</TableHead>\n                  ))}\n                  <TableHead>Status</TableHead>`
  );

  // 10. Table body
  content = content.replace(
    /<TableCell>\s*\{item\.isRejected \?/g,
    `{customCols.map(c => (\n                      <TableCell key={c.id} className="text-xs">{item.customData?.[c.key] || "-"}</TableCell>\n                    ))}\n                    <TableCell>\n                      {item.isRejected ?`
  );

  // 11. Modal
  if (!content.includes('<ManageColumnsModal')) {
    content = content.replace(
      /title="Import [^"]+"\n\s*\/>\n\s*<\/div>/,
      `title="Import ${entityName} Records"\n      />\n      <ManageColumnsModal\n        isOpen={isManageColsOpen}\n        onClose={() => setIsManageColsOpen(false)}\n        entityName="${entityName}"\n        onColumnsChange={loadData}\n      />\n    </div>`
    );
  }

  // 12. handleConfirmImport
  content = content.replace(
    /rejectionReason: String\(row\.rejectionReason \|\| ""\)(\s*)\}\)\)/,
    'rejectionReason: String(row.rejectionReason || ""),$1customData: customCols.reduce((acc: any, col: any) => ({ ...acc, [col.key]: row[col.key] }), {})$1}))'
  );

  // 13. handleExportExcel
  content = content.replace(
    /rejectionReason: p\.rejectionReason \|\| ""(\s*)\}\)\)/,
    'rejectionReason: p.rejectionReason || "",$1...(p.customData || {})$1}))'
  );

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

updateFile('frontend/src/app/pages/Consumption.tsx', 'Consumption');
updateFile('frontend/src/app/pages/RMCGrade.tsx', 'RMCGrade');
