"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDemoState } from "@/hooks/use-demo-state"
import { addLocation, getLocationsStore, setLocationStatus, updateLocation } from "@/lib/locations-data"
import type { Location, LocationType } from "@/lib/mock-data"
import { markSetupItemDone } from "@/lib/setup-checklist-data"

interface LocationFormState {
  name: string
  type: LocationType
  address: string
  area: string
  canSell: boolean
  isDefaultReceiving: boolean
}

const EMPTY_FORM: LocationFormState = {
  name: "",
  type: "shop",
  address: "",
  area: "",
  canSell: true,
  isDefaultReceiving: false,
}

/**
 * Class C for names/details, Class A for deletion — there is no delete
 * action at all here, only deactivate/reactivate, so history never blocks
 * anything in this UI (it just means a location can never be removed).
 */
export function LocationsSection() {
  const { state } = useDemoState()
  const persona = state.storePersona
  const [locations, setLocations] = useState<Location[]>(() => getLocationsStore(persona))

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<LocationFormState>(EMPTY_FORM)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<LocationFormState>(EMPTY_FORM)

  function refresh() {
    setLocations([...getLocationsStore(persona)])
  }

  function openEdit(location: Location) {
    setEditingId(location.id)
    setEditForm({
      name: location.name,
      type: location.type,
      address: location.address,
      area: location.area ?? "",
      canSell: location.canSell,
      isDefaultReceiving: location.isDefaultReceiving,
    })
  }

  function handleCreate() {
    addLocation(persona, {
      id: `loc-${Date.now().toString(36)}`,
      name: createForm.name,
      type: createForm.type,
      address: createForm.address,
      area: createForm.area || undefined,
      canSell: createForm.canSell,
      isDefaultReceiving: createForm.isDefaultReceiving,
      status: "active",
    })
    refresh()
    setCreateOpen(false)
    setCreateForm(EMPTY_FORM)
    toast.success("Location added")
    markSetupItemDone("locations")
  }

  function handleEditSave() {
    if (!editingId) return
    const existing = locations.find((l) => l.id === editingId)
    if (!existing) return
    updateLocation(persona, {
      ...existing,
      name: editForm.name,
      type: editForm.type,
      address: editForm.address,
      area: editForm.area || undefined,
      canSell: editForm.canSell,
      isDefaultReceiving: editForm.isDefaultReceiving,
    })
    refresh()
    setEditingId(null)
    toast.success("Location updated")
  }

  function toggleStatus(location: Location) {
    setLocationStatus(persona, location.id, location.status === "active" ? "inactive" : "active")
    refresh()
    toast.success(location.status === "active" ? "Location deactivated" : "Location reactivated")
  }

  return (
    <SettingsSectionCard title="Locations" settingClass="C">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Shops and warehouses stock, sell from, and transfer between.</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          New location
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {location.type}
                  </Badge>
                </TableCell>
                <TableCell>{location.address}</TableCell>
                <TableCell>{location.area ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {location.canSell && <Badge variant="outline">Sells</Badge>}
                    {location.isDefaultReceiving && <Badge variant="outline">Default receiving</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={location.status === "active" ? "default" : "secondary"}>{location.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(location)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(location)}>
                      {location.status === "active" ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Locations with stock or transaction history can only be deactivated, never deleted.
      </p>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New location</DialogTitle>
            <DialogDescription>Add a shop or warehouse to sell from or stock at.</DialogDescription>
          </DialogHeader>
          <LocationFormFields form={createForm} setForm={setCreateForm} idPrefix="create" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!createForm.name.trim() || !createForm.address.trim()} onClick={handleCreate}>
              Add location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit location</DialogTitle>
          </DialogHeader>
          <LocationFormFields form={editForm} setForm={setEditForm} idPrefix="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button disabled={!editForm.name.trim() || !editForm.address.trim()} onClick={handleEditSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSectionCard>
  )
}

function LocationFormFields({
  form,
  setForm,
  idPrefix,
}: {
  form: LocationFormState
  setForm: (updater: (prev: LocationFormState) => LocationFormState) => void
  idPrefix: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-type`}>Type</Label>
        <Select value={form.type} onValueChange={(value: LocationType) => setForm((prev) => ({ ...prev, type: value }))}>
          <SelectTrigger id={`${idPrefix}-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shop">Shop</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input
          id={`${idPrefix}-address`}
          value={form.address}
          onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-area`}>Area</Label>
        <Input
          id={`${idPrefix}-area`}
          value={form.area}
          onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${idPrefix}-can-sell`}>Can sell from here</Label>
        <Switch
          id={`${idPrefix}-can-sell`}
          checked={form.canSell}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, canSell: checked }))}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${idPrefix}-default-receiving`}>Default receiving location</Label>
        <Switch
          id={`${idPrefix}-default-receiving`}
          checked={form.isDefaultReceiving}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefaultReceiving: checked }))}
        />
      </div>
    </div>
  )
}
