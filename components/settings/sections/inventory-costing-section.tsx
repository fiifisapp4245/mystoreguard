import { ConceptTooltip } from "@/components/help/concept-tooltip"
import { LockedField } from "@/components/settings/locked-field"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { COSTING_METHOD_OPTIONS, DEFAULT_COSTING_METHOD } from "@/lib/settings-data"

/**
 * Class A — the costing method is fixed once real activity exists, since it
 * determines how existing stock was valued. Only the current method is
 * shown as a field; the others are listed for context, not as choices.
 */
export function InventoryCostingSection() {
  const currentOption = COSTING_METHOD_OPTIONS.find((option) => option.id === DEFAULT_COSTING_METHOD) ?? COSTING_METHOD_OPTIONS[0]
  const otherOptions = COSTING_METHOD_OPTIONS.filter((option) => option.id !== currentOption.id)

  return (
    <SettingsSectionCard
      title="Inventory costing"
      settingClass="A"
      description="How the cost of stock on hand is calculated as purchases come in at different prices."
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <LockedField label="Costing method" value={currentOption.label} description={currentOption.description} />
        </div>
        <ConceptTooltip conceptKey="weighted-average" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Other methods (not available once a method is locked in)</p>
        <div className="flex flex-col gap-2">
          {otherOptions.map((option) => (
            <div key={option.id} className="rounded-lg border border-dashed p-3 text-muted-foreground">
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs">{option.description}</p>
              {option.caution && <p className="text-xs italic">{option.caution}</p>}
            </div>
          ))}
        </div>
      </div>
    </SettingsSectionCard>
  )
}
