"use client";

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateWorkspaceDialogProps {
  onWorkspaceCreated?: (workspace: any) => void;
}

export function CreateWorkspaceDialog({ onWorkspaceCreated }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PRIVATE' | 'PUBLIC' | 'COMPETITIVE'>('PRIVATE');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOpen(false);
        setName('');
        setDescription('');
        setType('PRIVATE');
        
        if (onWorkspaceCreated) {
          onWorkspaceCreated(data.workspace);
        }
        
        // Refresh the page to show new workspace
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Create New Workspace
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a squad to trade and compete with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Name */}
          <div>
            <label className="text-slate-300 text-sm mb-2 block">
              Workspace Name <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="Squad Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-300 text-sm mb-2 block">
              Description (optional)
            </label>
            <Input
              placeholder="Friends trading together since 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={200}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-slate-300 text-sm mb-2 block">
              Workspace Type
            </label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="PRIVATE" className="text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-xs text-slate-400">Invite-only squad</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="PUBLIC" className="text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>🌐</span>
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-xs text-slate-400">Anyone can join</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="COMPETITIVE" className="text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>🏆</span>
                    <div>
                      <p className="font-medium">Competitive</p>
                      <p className="text-xs text-slate-400">Full transparency required</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            {creating ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
