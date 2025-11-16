'use client'

import { useState } from "react"
import { FilePlus, Palette, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface CreateTemplateModalProps {
  onCreate?: (templateData: {
    name: string
    description: string
    template_type: string
  }) => void
}

const templateTypes = [
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Perfect for regular updates and news',
    icon: '📰'
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Great for marketing campaigns',
    icon: '🎯'
  },
  {
    id: 'transactional',
    name: 'Transactional',
    description: 'For receipts, confirmations, etc.',
    icon: '📧'
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Perfect for onboarding new users',
    icon: '👋'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Build your own template from scratch',
    icon: '🎨'
  }
]

export function CreateTemplateModal({ onCreate }: CreateTemplateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: ''
  })
  const [creating, setCreating] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.template_type) {
      alert('Please fill in required fields')
      return
    }

    setCreating(true)
    try {
      // Simulate creation delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (onCreate) {
        onCreate(formData)
      }
      
      // Reset and close
      setFormData({ name: '', description: '', template_type: '' })
      setIsOpen(false)
      alert('Template created successfully!')
    } catch (error) {
      alert('Failed to create template. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const resetModal = () => {
    setFormData({ name: '', description: '', template_type: '' })
    setCreating(false)
  }

  const selectedType = templateTypes.find(t => t.id === formData.template_type)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetModal()
    }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-300 rounded-md shadow-sm transition-all duration-200"
          title="Create New Template"
        >
          <FilePlus className="h-4 w-4 text-green-600" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Create New Template
          </DialogTitle>
          <DialogDescription>
            Create a new email template to use for your campaigns.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Monthly Newsletter, Welcome Email"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="template-type">Template Type *</Label>
            <Select
              value={formData.template_type}
              onValueChange={(value) => handleInputChange('template_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Type Preview */}
          {selectedType && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{selectedType.icon}</div>
                  <div>
                    <h4 className="font-medium">{selectedType.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template will be used for..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.template_type || creating}
              className="min-w-[120px]"
            >
              {creating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FilePlus className="h-4 w-4" />
                  Create Template
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}