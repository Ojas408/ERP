import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Plus } from 'lucide-react';
import { fetchCustomColumns, createCustomColumn, deleteCustomColumn } from '../services/api';
import { toast } from 'sonner';

interface ManageColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string; // e.g., 'Production', 'Consumption'
  onColumnsChange?: () => void; // Callback to refresh data in parent
}

export function ManageColumnsModal({ isOpen, onClose, entityName, onColumnsChange }: ManageColumnsModalProps) {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCol, setNewCol] = useState({ name: '', type: 'string' });

  const loadColumns = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomColumns(entityName);
      setColumns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load columns', error);
      toast.error('Failed to load custom columns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadColumns();
      setIsAdding(false);
      setNewCol({ name: '', type: 'string' });
    }
  }, [isOpen, entityName]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCol.name.trim()) return;

    try {
      // Create a URL-friendly key from the name
      const key = newCol.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      await createCustomColumn({
        entity: entityName,
        name: newCol.name.trim(),
        key: key,
        type: newCol.type,
      });
      
      toast.success('Column added successfully');
      setNewCol({ name: '', type: 'string' });
      setIsAdding(false);
      loadColumns();
      if (onColumnsChange) onColumnsChange();
    } catch (error) {
      toast.error('Failed to add column');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this column? It will not delete existing data, but the column will be hidden.')) return;
    try {
      await deleteCustomColumn(id);
      toast.success('Column deleted');
      loadColumns();
      if (onColumnsChange) onColumnsChange();
    } catch (error) {
      toast.error('Failed to delete column');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Custom Columns</DialogTitle>
          <DialogDescription>
            Add or remove custom fields for {entityName}. These will appear in tables and Excel exports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Loading columns...</div>
          ) : (
            <div className="space-y-3">
              {columns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No custom columns added yet.</p>
              ) : (
                columns.map((col) => (
                  <div key={col.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border text-sm">
                    <div>
                      <p className="font-semibold">{col.name}</p>
                      <p className="text-xs text-muted-foreground">Type: {col.type}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(col.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}

              {isAdding ? (
                <form onSubmit={handleAdd} className="mt-4 p-4 border rounded-md bg-muted/10 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Column Name</Label>
                    <Input 
                      placeholder="e.g. Weather, Supplier Name" 
                      value={newCol.name}
                      onChange={e => setNewCol({...newCol, name: e.target.value})}
                      className="h-8 text-xs"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Type</Label>
                    <Select value={newCol.type} onValueChange={v => setNewCol({...newCol, type: v})}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="h-8 text-xs">Save Column</Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mt-2 h-9 border-dashed text-xs"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New Column
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
