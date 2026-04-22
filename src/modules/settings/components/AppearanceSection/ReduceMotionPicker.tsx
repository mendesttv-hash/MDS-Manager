import { RadioGroup } from "@/components";
import { useDisplayStore } from "@/stores";

const MOTION_OPTIONS = [
  {
    value: "system" as const,
    label: "Par défaut (système)",
    description: "Suit les préférences de votre système",
  },
  {
    value: "on" as const,
    label: "Réduit",
    description: "Désactive toutes les animations",
  },
  {
    value: "off" as const,
    label: "Activé",
    description: "Active toujours les animations",
  },
];

export function ReduceMotionPicker() {
  const reduceMotion = useDisplayStore((s) => s.reduceMotion);
  const setReduceMotion = useDisplayStore((s) => s.setReduceMotion);

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup.Root value={reduceMotion} onValueChange={setReduceMotion}>
        <RadioGroup.Label>Réduire les animations</RadioGroup.Label>
        <RadioGroup.Options>
          {MOTION_OPTIONS.map((opt) => (
            <RadioGroup.Item
              key={opt.value}
              value={opt.value}
              label={opt.label}
              description={opt.description}
            />
          ))}
        </RadioGroup.Options>
      </RadioGroup.Root>
    </div>
  );
}